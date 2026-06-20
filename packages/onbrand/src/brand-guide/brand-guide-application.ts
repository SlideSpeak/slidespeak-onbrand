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
import { toColorTokenCreateRecords } from "./brand-kit/color/record";
import {
  toPresentationKitCreateRecord,
  toPresentationKitWriteRecord,
} from "./presentation-kit/record";
import {
  DuplicateBrandGuideNameError,
  DuplicateColorTokenNameError,
  DuplicateDecorativeAssetNameError,
} from "./application-service";
import type {
  BrandGuideApplicationService,
  MaterializeBrandKitAssetsRequest,
  GetBrandKitAssetPreviewUrlRequest,
  BrandGuideView,
  PrepareBrandGuideAssetUploadsRequest,
  PrepareBrandGuideAssetUploadsResult,
  WriteBrandGuideRequest,
  WriteBrandGuideResult,
  CreateBrandGuideRequest,
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
  listBrandGuideSummaries,
  loadBrandGuideRecord,
  toBrandGuideView,
} from "./brand-guide-store";

export class PersistentBrandGuideApplication implements BrandGuideApplicationService {
  private readonly brandKitAssetFiles: BrandKitAssetFileWorkflow;

  constructor(
    private readonly prisma: PrismaClient,
    s3: Pick<typeof S3, "getPresigned" | "putPresigned" | "deleteObject">,
    brandKitAssetBucket: string,
    assetPresignedUrlExpiresInSeconds: number,
  ) {
    this.brandKitAssetFiles = new BrandKitAssetFileWorkflow(
      s3,
      brandKitAssetBucket,
      assetPresignedUrlExpiresInSeconds,
    );
  }

  listBrandGuides = async (owner: BrandGuideOwner): Promise<readonly BrandGuideSummary[]> =>
    listBrandGuideSummaries(this.prisma, owner);

  getBrandGuide = async (owner: BrandGuideOwner, brandGuideId: string): Promise<BrandGuideView> =>
    toBrandGuideView(await loadBrandGuideRecord(this.prisma, owner, brandGuideId));

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
    const record = await loadBrandGuideRecord(this.prisma, owner, brandGuideId);
    return this.brandKitAssetFiles.materialize({
      brandGuideId,
      outputDirectory,
      assets: record.brandKit?.assets ?? [],
    });
  };

  getBrandKitAssetPreviewUrl = async (
    owner: BrandGuideOwner,
    { brandGuideId, assetHandle }: GetBrandKitAssetPreviewUrlRequest,
  ): Promise<string> => {
    const record = await loadBrandGuideRecord(this.prisma, owner, brandGuideId);
    const asset = record.brandKit?.assets.find(
      (candidate) => brandKitAssetHandle(candidate) === assetHandle,
    );
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
  ): Promise<WriteBrandGuideResult> => {
    const assetRecords = [
      toBrandKitAssetFileRecord({
        kind: "LOGO",
        ownerUserId: owner.ownerUserId,
        brandGuideId: request.brandGuide.id,
        asset: request.brandKit.logo,
      }),
      ...(request.brandKit.decorativeAssets ?? []).map((asset, index) =>
        toBrandKitAssetFileRecord({
          kind: "DECORATIVE_ASSET",
          ownerUserId: owner.ownerUserId,
          brandGuideId: request.brandGuide.id,
          asset,
          sortOrder: index + 1,
        }),
      ),
    ];

    const action = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.brandGuide.findUnique({
        where: {
          ownerUserId_slug: { ownerUserId: owner.ownerUserId, slug: request.brandGuide.id },
        },
        select: { id: true },
      });
      const brandGuide = await tx.brandGuide.upsert({
        where: {
          ownerUserId_slug: { ownerUserId: owner.ownerUserId, slug: request.brandGuide.id },
        },
        create: {
          ownerUserId: owner.ownerUserId,
          slug: request.brandGuide.id,
          schemaVersion: 1,
          name: request.brandGuide.name,
          description: request.brandGuide.description,
        },
        update: { name: request.brandGuide.name, description: request.brandGuide.description },
      });
      await tx.brandKit.deleteMany({ where: { brandGuideId: brandGuide.id } });
      await tx.presentationKit.deleteMany({ where: { brandGuideId: brandGuide.id } });
      await tx.brandKit.create({
        data: {
          brandGuideId: brandGuide.id,
          colors: { create: toColorTokenCreateRecords(request.brandKit.colors) },
          assets: { create: assetRecords },
        },
      });
      await tx.presentationKit.create({
        data: toPresentationKitCreateRecord(brandGuide.id, request.presentationKit),
      });
      return existing ? "UPDATED" : "CREATED";
    });

    return {
      brandGuideId: request.brandGuide.id,
      action,
      brandGuide: await this.getBrandGuide(owner, request.brandGuide.id),
    };
  };

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
}

const normalizeOptionalText = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const isPrismaUniqueConstraintError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
