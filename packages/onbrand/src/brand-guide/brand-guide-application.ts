import { BrandKitAssetFileWorkflow } from "./brand-kit/asset-file/workflow";
import {
  brandGuideSlugFromName,
  colorTokenIdFromName,
  decorativeAssetIdFromName,
} from "./management-identifiers";
import type { S3 } from "@onbrand/s3";
import type { PrismaClient } from "@prisma/client";
import type { BrandGuideOwner } from "./owner";
import type { BrandGuideSummary } from "./brand-guide";
import type { BrandKitAssetMaterializationPlan } from "./brand-kit/asset-file/index";
import { brandKitAssetHandle, toBrandKitAssetFileRecord } from "./brand-kit/asset-file/record";
import {
  toPresentationKitCreateRecord,
  toPresentationKitWriteRecord,
} from "./presentation-kit/record";
import {
  DuplicateBrandGuideNameError,
  DuplicateColorTokenNameError,
  DuplicateDecorativeAssetNameError,
  InvalidSourceUrlError,
  SourceUrlNotFoundError,
} from "./application-service";
import { brandKitAssetFileObjectKey } from "./brand-kit/asset-file/object-key";
import { toColorTokenCreateRecords } from "./brand-kit/color/record";
import { extractBrandGuideSource, type ExtractedBrandKitAsset } from "./source-url-extraction";
import type {
  BrandGuideApplicationService,
  BrandGuideGenerationRequest,
  MaterializeBrandKitAssetsRequest,
  GetBrandKitAssetPreviewUrlRequest,
  BrandGuideView,
  PrepareBrandGuideAssetUploadsRequest,
  PrepareBrandGuideAssetUploadsResult,
  WriteBrandGuideRequest,
  WriteBrandGuideResult,
  CreateBrandGuideRequest,
  CreateBrandGuideGenerationRequest,
  UpdateBrandGuideMetadataRequest,
  UpsertColorTokenRequest,
  DeleteColorTokenRequest,
  UpsertLogoRequest,
  DeleteLogoRequest,
  UpsertDecorativeAssetRequest,
  DeleteDecorativeAssetRequest,
  UpdatePresentationKitRequest,
} from "./application-service";
import {
  loadBrandGuideRecord,
  PrismaBrandGuideRegistry,
  type BrandGuideRegistry,
} from "./brand-guide-store";
import { normalizePublicHttpUrl, assertPublicOutboundUrl } from "./source-url-security";
import { titleCase } from "./text";

type ExtractedBrandKitAssetForStorage = ExtractedBrandKitAsset &
  Readonly<{ kind: "LOGO" | "DECORATIVE_ASSET"; sortOrder: number }>;

export class PersistentBrandGuideApplication implements BrandGuideApplicationService {
  private readonly brandKitAssetFiles: BrandKitAssetFileWorkflow;
  private readonly brandGuides: BrandGuideRegistry;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly s3: Pick<
      typeof S3,
      "getPresigned" | "putPresigned" | "putObject" | "deleteObject"
    >,
    private readonly brandKitAssetBucket: string,
    assetPresignedUrlExpiresInSeconds: number,
    brandGuides: BrandGuideRegistry = new PrismaBrandGuideRegistry(prisma),
  ) {
    this.brandGuides = brandGuides;
    this.brandKitAssetFiles = new BrandKitAssetFileWorkflow(
      s3,
      brandKitAssetBucket,
      assetPresignedUrlExpiresInSeconds,
    );
  }

  listBrandGuides = async (owner: BrandGuideOwner): Promise<readonly BrandGuideSummary[]> =>
    this.brandGuides.list(owner);

  getBrandGuide = async (owner: BrandGuideOwner, brandGuideId: string): Promise<BrandGuideView> =>
    this.brandGuides.load(owner, brandGuideId);

  createBrandGuide = async (
    owner: BrandGuideOwner,
    request: CreateBrandGuideRequest,
  ): Promise<BrandGuideView> => {
    await this.assertUniqueBrandGuideName(owner, request.name);
    const slug = brandGuideSlugFromName(request.name);
    await this.assertUniqueBrandGuideSlug(owner, slug);
    try {
      await this.prisma.brandGuide.create({
        data: {
          ownerUserId: owner.ownerUserId,
          slug,
          schemaVersion: 1,
          name: request.name.trim(),
          description: normalizeOptionalText(request.description),
          brandKit: { create: {} },
          presentationKit: { create: {} },
        },
      });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error))
        throw new DuplicateBrandGuideNameError(request.name);
      throw error;
    }
    return this.getBrandGuide(owner, slug);
  };

  createBrandGuideGenerationRequest = async (
    owner: BrandGuideOwner,
    request: CreateBrandGuideGenerationRequest,
  ): Promise<BrandGuideGenerationRequest> => {
    const sourceUrl = await normalizeSourceUrl(request.sourceUrl);
    const extracted = await extractBrandGuideSource(sourceUrl).catch(() => {
      throw new SourceUrlNotFoundError(sourceUrl);
    });
    const baseName = extracted.brandName ?? brandGuideNameFromSourceUrl(sourceUrl);

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const { name, slug } = await this.nextAvailableBrandGuideIdentity(owner, baseName, attempt);
      const uploadedAssetKeys: string[] = [];
      try {
        const assets = await this.uploadExtractedBrandKitAssets(
          owner,
          slug,
          [
            ...(extracted.logo ? [{ ...extracted.logo, kind: "LOGO" as const, sortOrder: 0 }] : []),
            ...extracted.decorativeAssets.map((asset, index) => ({
              ...asset,
              kind: "DECORATIVE_ASSET" as const,
              sortOrder: index,
            })),
          ],
          (s3Key) => uploadedAssetKeys.push(s3Key),
        );
        const createdAt = new Date();
        const brandGuide = await this.prisma.$transaction(async (tx) =>
          tx.brandGuide.create({
            data: {
              ownerUserId: owner.ownerUserId,
              slug,
              schemaVersion: 1,
              name,
              description: `Brand Guide extracted from ${sourceUrl}.`,
              brandKit: {
                create: {
                  colors: { create: toColorTokenCreateRecords(extracted.colors) },
                  assets: { create: assets },
                },
              },
              presentationKit: { create: {} },
            },
          }),
        );
        return toBrandGuideGenerationRequest({
          id: brandGuide.slug,
          sourceUrl,
          status: "COMPLETED",
          errorMessage: null,
          createdAt,
          updatedAt: createdAt,
          brandGuide: {
            slug: brandGuide.slug,
            name: brandGuide.name,
            description: brandGuide.description,
          },
        });
      } catch (error) {
        await Promise.allSettled(
          uploadedAssetKeys.map((key) => this.brandKitAssetFiles.delete(key)),
        );
        if (isPrismaUniqueConstraintError(error)) continue;
        throw error;
      }
    }

    throw new DuplicateBrandGuideNameError(baseName);
  };

  updateBrandGuideMetadata = async (
    owner: BrandGuideOwner,
    request: UpdateBrandGuideMetadataRequest,
  ): Promise<BrandGuideView> => {
    const current = await loadBrandGuideRecord(this.prisma, owner, request.brandGuideId);
    if (request.name !== undefined && request.name.trim() !== current.name) {
      await this.assertUniqueBrandGuideName(owner, request.name, request.brandGuideId);
    }
    await this.prisma.brandGuide.update({
      where: { ownerUserId_slug: { ownerUserId: owner.ownerUserId, slug: request.brandGuideId } },
      data: {
        ...(request.name === undefined ? {} : { name: request.name.trim() }),
        ...(request.description === undefined
          ? {}
          : { description: normalizeOptionalText(request.description) }),
      },
    });
    return this.getBrandGuide(owner, request.brandGuideId);
  };

  deleteBrandGuide = async (owner: BrandGuideOwner, brandGuideId: string): Promise<void> => {
    const record = await loadBrandGuideRecord(this.prisma, owner, brandGuideId);
    const assetKeys = record.brandKit?.assets.map((asset) => asset.s3Key) ?? [];
    await this.prisma.brandGuide.delete({
      where: { ownerUserId_slug: { ownerUserId: owner.ownerUserId, slug: brandGuideId } },
    });
    for (const s3Key of assetKeys) await this.brandKitAssetFiles.delete(s3Key);
  };

  upsertColorToken = async (
    owner: BrandGuideOwner,
    request: UpsertColorTokenRequest,
  ): Promise<BrandGuideView> => {
    const brandKitId = await this.ensureBrandKitId(owner, request.brandGuideId);
    const tokenId = colorTokenIdFromName(request.name);
    const existing = request.previousName
      ? await this.prisma.colorToken.findUnique({
          where: {
            brandKitId_tokenId: { brandKitId, tokenId: colorTokenIdFromName(request.previousName) },
          },
          select: { id: true },
        })
      : null;
    const tokenWithTargetId = await this.prisma.colorToken.findUnique({
      where: { brandKitId_tokenId: { brandKitId, tokenId } },
      select: { id: true },
    });
    if (tokenWithTargetId && tokenWithTargetId.id !== existing?.id) {
      throw new DuplicateColorTokenNameError(request.name);
    }
    await this.prisma.colorToken.upsert({
      where: { id: existing?.id ?? "missing" },
      create: {
        brandKitId,
        tokenId,
        name: request.name.trim(),
        value: request.value.toUpperCase(),
        description: normalizeOptionalText(request.description) ?? "",
        sortOrder: 0,
      },
      update: {
        tokenId,
        name: request.name.trim(),
        value: request.value.toUpperCase(),
        description: normalizeOptionalText(request.description) ?? "",
      },
    });
    return this.getBrandGuide(owner, request.brandGuideId);
  };

  deleteColorToken = async (
    owner: BrandGuideOwner,
    request: DeleteColorTokenRequest,
  ): Promise<BrandGuideView> => {
    const brandKitId = await this.ensureBrandKitId(owner, request.brandGuideId);
    await this.prisma.colorToken.delete({
      where: { brandKitId_tokenId: { brandKitId, tokenId: colorTokenIdFromName(request.name) } },
    });
    return this.getBrandGuide(owner, request.brandGuideId);
  };

  updatePresentationKit = async (
    owner: BrandGuideOwner,
    request: UpdatePresentationKitRequest,
  ): Promise<BrandGuideView> => {
    const record = await loadBrandGuideRecord(this.prisma, owner, request.brandGuideId);
    await this.prisma.presentationKit.upsert({
      where: { brandGuideId: record.id },
      create: toPresentationKitCreateRecord(record.id, request.presentationKit),
      update: toPresentationKitWriteRecord(request.presentationKit),
    });
    return this.getBrandGuide(owner, request.brandGuideId);
  };

  materializeBrandKitAssets = async (
    owner: BrandGuideOwner,
    { brandGuideId, outputDirectory }: MaterializeBrandKitAssetsRequest,
  ): Promise<BrandKitAssetMaterializationPlan> => {
    const assets = await this.brandGuides.loadBrandKitAssets(owner, brandGuideId);
    return this.brandKitAssetFiles.materialize({
      brandGuideId,
      outputDirectory,
      assets,
    });
  };

  getBrandKitAssetPreviewUrl = async (
    owner: BrandGuideOwner,
    { brandGuideId, assetHandle }: GetBrandKitAssetPreviewUrlRequest,
  ): Promise<string> => {
    const assets = await this.brandGuides.loadBrandKitAssets(owner, brandGuideId);
    const asset = assets.find((candidate) => brandKitAssetHandle(candidate) === assetHandle);
    if (!asset) throw new Error(`Unknown Brand Kit asset: ${assetHandle}`);
    return this.brandKitAssetFiles.previewUrl(asset);
  };

  prepareBrandGuideAssetUploads = async (
    owner: BrandGuideOwner,
    request: PrepareBrandGuideAssetUploadsRequest,
  ): Promise<PrepareBrandGuideAssetUploadsResult> =>
    this.brandKitAssetFiles.prepareUploads({
      ownerUserId: owner.ownerUserId,
      brandGuideId: request.brandGuideId,
      uploads: request.uploads,
    });

  upsertLogo = async (
    owner: BrandGuideOwner,
    request: UpsertLogoRequest,
  ): Promise<BrandGuideView> => {
    const brandKitId = await this.ensureBrandKitId(owner, request.brandGuideId);
    const existing = await this.prisma.brandKitAsset.findFirst({
      where: { brandKitId, kind: "LOGO" },
      select: { id: true, s3Key: true },
    });
    if (existing && request.asset.s3Key === "") {
      await this.prisma.brandKitAsset.update({
        where: { id: existing.id },
        data: { description: normalizeOptionalText(request.asset.description) ?? "" },
      });
      return this.getBrandGuide(owner, request.brandGuideId);
    }
    const record = toBrandKitAssetFileRecord({
      kind: "LOGO",
      ownerUserId: owner.ownerUserId,
      brandGuideId: request.brandGuideId,
      asset: {
        ...request.asset,
        assetId: "logo",
        name: "Logo",
        description: normalizeOptionalText(request.asset.description) ?? "",
      },
    });
    await this.prisma.brandKitAsset.upsert({
      where: { id: existing?.id ?? "missing" },
      create: { ...record, brandKitId, sortOrder: 0 },
      update: record,
    });
    if (existing && existing.s3Key !== record.s3Key)
      await this.brandKitAssetFiles.delete(existing.s3Key);
    return this.getBrandGuide(owner, request.brandGuideId);
  };

  deleteLogo = async (
    owner: BrandGuideOwner,
    request: DeleteLogoRequest,
  ): Promise<BrandGuideView> => {
    const brandKitId = await this.ensureBrandKitId(owner, request.brandGuideId);
    const existing = await this.prisma.brandKitAsset.findFirst({
      where: { brandKitId, kind: "LOGO" },
    });
    if (existing) {
      await this.prisma.brandKitAsset.delete({ where: { id: existing.id } });
      await this.brandKitAssetFiles.delete(existing.s3Key);
    }
    return this.getBrandGuide(owner, request.brandGuideId);
  };

  upsertDecorativeAsset = async (
    owner: BrandGuideOwner,
    request: UpsertDecorativeAssetRequest,
  ): Promise<BrandGuideView> => {
    const brandKitId = await this.ensureBrandKitId(owner, request.brandGuideId);
    const assetId = decorativeAssetIdFromName(request.asset.name);
    const existingByPreviousName = request.previousName
      ? await this.prisma.brandKitAsset.findUnique({
          where: {
            brandKitId_assetId: {
              brandKitId,
              assetId: decorativeAssetIdFromName(request.previousName),
            },
          },
          select: { id: true, s3Key: true },
        })
      : null;
    const assetWithTargetId = await this.prisma.brandKitAsset.findUnique({
      where: { brandKitId_assetId: { brandKitId, assetId } },
      select: { id: true, s3Key: true },
    });
    if (
      existingByPreviousName &&
      assetWithTargetId &&
      assetWithTargetId.id !== existingByPreviousName.id
    ) {
      throw new DuplicateDecorativeAssetNameError(request.asset.name);
    }
    const existing = existingByPreviousName ?? assetWithTargetId;
    if (existing && (request.asset.s3Key === "" || request.asset.s3Key === existing.s3Key)) {
      await this.prisma.brandKitAsset.update({
        where: { id: existing.id },
        data: {
          assetId,
          name: request.asset.name.trim(),
          description: normalizeOptionalText(request.asset.description) ?? "",
        },
      });
      return this.getBrandGuide(owner, request.brandGuideId);
    }
    const record = toBrandKitAssetFileRecord({
      kind: "DECORATIVE_ASSET",
      ownerUserId: owner.ownerUserId,
      brandGuideId: request.brandGuideId,
      asset: {
        ...request.asset,
        id: assetId,
        description: normalizeOptionalText(request.asset.description) ?? "",
      },
      sortOrder: 0,
    });
    await this.prisma.brandKitAsset.upsert({
      where: { id: existing?.id ?? "missing" },
      create: { ...record, brandKitId },
      update: record,
    });
    if (existing && existing.s3Key !== record.s3Key)
      await this.brandKitAssetFiles.delete(existing.s3Key);
    return this.getBrandGuide(owner, request.brandGuideId);
  };

  deleteDecorativeAsset = async (
    owner: BrandGuideOwner,
    request: DeleteDecorativeAssetRequest,
  ): Promise<BrandGuideView> => {
    const brandKitId = await this.ensureBrandKitId(owner, request.brandGuideId);
    const existing = await this.prisma.brandKitAsset.findUnique({
      where: {
        brandKitId_assetId: { brandKitId, assetId: decorativeAssetIdFromName(request.name) },
      },
    });
    if (existing) {
      await this.prisma.brandKitAsset.delete({ where: { id: existing.id } });
      await this.brandKitAssetFiles.delete(existing.s3Key);
    }
    return this.getBrandGuide(owner, request.brandGuideId);
  };

  writeBrandGuide = async (
    owner: BrandGuideOwner,
    request: WriteBrandGuideRequest,
  ): Promise<WriteBrandGuideResult> => this.brandGuides.replace(owner, request);

  private assertUniqueBrandGuideName = async (
    owner: BrandGuideOwner,
    name: string,
    exceptBrandGuideId?: string,
  ): Promise<void> => {
    const row = await this.prisma.brandGuide.findFirst({
      where: {
        ownerUserId: owner.ownerUserId,
        name: name.trim(),
        ...(exceptBrandGuideId ? { NOT: { slug: exceptBrandGuideId } } : {}),
      },
      select: { id: true },
    });
    if (row) throw new DuplicateBrandGuideNameError(name);
  };

  private assertUniqueBrandGuideSlug = async (
    owner: BrandGuideOwner,
    slug: string,
  ): Promise<void> => {
    const row = await this.prisma.brandGuide.findUnique({
      where: { ownerUserId_slug: { ownerUserId: owner.ownerUserId, slug } },
      select: { name: true },
    });
    if (row) throw new DuplicateBrandGuideNameError(row.name);
  };

  private ensureBrandKitId = async (
    owner: BrandGuideOwner,
    brandGuideId: string,
  ): Promise<string> => {
    const record = await loadBrandGuideRecord(this.prisma, owner, brandGuideId);
    if (record.brandKit) return record.brandKit.id;
    const brandKit = await this.prisma.brandKit.create({ data: { brandGuideId: record.id } });
    return brandKit.id;
  };

  private uploadExtractedBrandKitAssets = async (
    owner: BrandGuideOwner,
    brandGuideId: string,
    assets: readonly ExtractedBrandKitAssetForStorage[],
    onUploadedKey: (s3Key: string) => void,
  ) => {
    const uploadedAssets = [];
    for (const asset of assets) {
      const s3Key = brandKitAssetFileObjectKey({
        ownerUserId: owner.ownerUserId,
        brandGuideId,
        assetId: asset.assetId,
        filename: asset.filename,
      });
      await this.s3.putObject({
        bucket: this.brandKitAssetBucket,
        key: s3Key,
        body: asset.bytes,
        contentType: asset.mimeType,
        checksumSha256Base64: Buffer.from(asset.sha256, "hex").toString("base64"),
      });
      onUploadedKey(s3Key);
      uploadedAssets.push({
        assetId: asset.assetId,
        kind: asset.kind,
        name: asset.name,
        filename: asset.filename,
        mimeType: asset.mimeType,
        description: asset.description,
        s3Key,
        byteSize: asset.byteSize,
        sha256: asset.sha256,
        sortOrder: asset.sortOrder,
      });
    }
    return uploadedAssets;
  };

  private nextAvailableBrandGuideIdentity = async (
    owner: BrandGuideOwner,
    baseName: string,
    startAt: number,
  ): Promise<Readonly<{ name: string; slug: string }>> => {
    for (let offset = startAt; offset < startAt + 20; offset += 1) {
      const name = offset === 0 ? baseName : `${baseName} ${offset + 1}`;
      const slug = brandGuideSlugFromName(name);
      const existingName = await this.prisma.brandGuide.findFirst({
        where: { ownerUserId: owner.ownerUserId, name },
        select: { id: true },
      });
      if (existingName) continue;
      const existingSlug = await this.prisma.brandGuide.findUnique({
        where: { ownerUserId_slug: { ownerUserId: owner.ownerUserId, slug } },
        select: { id: true },
      });
      if (!existingSlug) return { name, slug };
    }
    throw new DuplicateBrandGuideNameError(baseName);
  };
}

const normalizeOptionalText = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeSourceUrl = async (value: string): Promise<string> => {
  const url = normalizePublicHttpUrl(value);
  if (!url) throw new InvalidSourceUrlError(value);
  try {
    await assertPublicOutboundUrl(url);
    return url.toString();
  } catch {
    throw new InvalidSourceUrlError(value);
  }
};

const brandGuideNameFromSourceUrl = (sourceUrl: string): string => {
  const host = new URL(sourceUrl).hostname.replace(/^www\./iu, "");
  const name = host.split(".").at(0) ?? host;
  return titleCase(name.replace(/[-_]+/gu, " "));
};

const toBrandGuideGenerationRequest = (request: {
  id: string;
  sourceUrl: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  brandGuide: { slug: string; name: string; description: string | null };
}): BrandGuideGenerationRequest => ({
  id: request.id,
  sourceUrl: request.sourceUrl,
  status: request.status,
  errorMessage: request.errorMessage,
  createdAt: request.createdAt.toISOString(),
  updatedAt: request.updatedAt.toISOString(),
  brandGuide: {
    id: request.brandGuide.slug,
    name: request.brandGuide.name,
    description: request.brandGuide.description,
  },
});

const isPrismaUniqueConstraintError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
