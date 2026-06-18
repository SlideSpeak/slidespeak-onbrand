import { BrandKitAssetFileWorkflow } from "./brand-kit/asset-file/workflow";
import type { S3 } from "@onbrand/s3";
import type { PrismaClient } from "@prisma/client";
import type { BrandGuideOwner } from "./owner";
import type { BrandGuideSummary } from "./brand-guide";
import type { BrandKitAssetMaterializationPlan } from "./brand-kit/asset-file/index";
import { brandKitAssetHandle } from "./brand-kit/asset-file/workflow";
import { toColorTokenCreateRecords } from "./brand-kit/color/record";
import { toDecorativeAssetRecord } from "./brand-kit/decorative-assets/record";
import { toLogoAssetRecord } from "./brand-kit/logo/record";
import { toPresentationKitCreateRecord } from "./presentation-kit/record";
import type {
  BrandGuideApplicationService,
  MaterializeBrandKitAssetsRequest,
  GetBrandKitAssetPreviewUrlRequest,
  BrandGuideView,
  PrepareBrandGuideAssetUploadsRequest,
  PrepareBrandGuideAssetUploadsResult,
  WriteBrandGuideRequest,
  WriteBrandGuideResult,
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
    s3: Pick<typeof S3, "getPresigned" | "putPresigned">,
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

  materializeBrandKitAssets = async (
    owner: BrandGuideOwner,
    { brandGuideId, outputDirectory }: MaterializeBrandKitAssetsRequest,
  ): Promise<BrandKitAssetMaterializationPlan> => {
    const record = await loadBrandGuideRecord(this.prisma, owner, brandGuideId);
    return this.brandKitAssetFiles.materialize({
      brandGuideId,
      outputDirectory,
      assets: record.brandKit!.assets,
    });
  };

  getBrandKitAssetPreviewUrl = async (
    owner: BrandGuideOwner,
    { brandGuideId, assetHandle }: GetBrandKitAssetPreviewUrlRequest,
  ): Promise<string> => {
    const record = await loadBrandGuideRecord(this.prisma, owner, brandGuideId);
    const asset = record.brandKit!.assets.find(
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

  writeBrandGuide = async (
    owner: BrandGuideOwner,
    request: WriteBrandGuideRequest,
  ): Promise<WriteBrandGuideResult> => {
    const assetRecords = [
      toLogoAssetRecord({
        ownerUserId: owner.ownerUserId,
        brandGuideId: request.brandGuide.id,
        asset: request.brandKit.logo,
      }),
      ...(request.brandKit.decorativeAssets ?? []).map((asset, index) =>
        toDecorativeAssetRecord({
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
}
