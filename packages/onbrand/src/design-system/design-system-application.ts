import { BrandKitAssetFileWorkflow } from "./brand-kit/asset-file/workflow";
import type { S3 } from "@onbrand/s3";
import type { PrismaClient } from "@prisma/client";
import type { DesignSystemOwner } from "./owner";
import type { DesignSystemSummary } from "./design-system";
import type { BrandKitAssetMaterializationPlan } from "./brand-kit/asset-file/index";
import { toDecorativeAssetRecord } from "./brand-kit/decorative-assets/record";
import { toLogoAssetRecord } from "./brand-kit/logo/record";
import type {
  DesignSystemApplicationService,
  MaterializeBrandKitAssetsRequest,
  DesignSystemView,
  PrepareDesignSystemAssetUploadsRequest,
  PrepareDesignSystemAssetUploadsResult,
  WriteDesignSystemRequest,
  WriteDesignSystemResult,
} from "./application-service";
import {
  listDesignSystemSummaries,
  loadDesignSystemRecord,
  toDesignSystemView,
} from "./storage/design-system-store";

export class PersistentDesignSystemApplication implements DesignSystemApplicationService {
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

  listDesignSystems = async (owner: DesignSystemOwner): Promise<readonly DesignSystemSummary[]> =>
    listDesignSystemSummaries(this.prisma, owner);

  getDesignSystem = async (
    owner: DesignSystemOwner,
    designSystemId: string,
  ): Promise<DesignSystemView> =>
    toDesignSystemView(await loadDesignSystemRecord(this.prisma, owner, designSystemId));

  materializeBrandKitAssets = async (
    owner: DesignSystemOwner,
    { designSystemId, outputDirectory }: MaterializeBrandKitAssetsRequest,
  ): Promise<BrandKitAssetMaterializationPlan> => {
    const record = await loadDesignSystemRecord(this.prisma, owner, designSystemId);
    return this.brandKitAssetFiles.materialize({
      designSystemId,
      outputDirectory,
      assets: record.brandKit!.assets,
    });
  };

  prepareDesignSystemAssetUploads = async (
    owner: DesignSystemOwner,
    request: PrepareDesignSystemAssetUploadsRequest,
  ): Promise<PrepareDesignSystemAssetUploadsResult> =>
    this.brandKitAssetFiles.prepareUploads({
      ownerUserId: owner.ownerUserId,
      designSystemId: request.designSystemId,
      uploads: request.uploads,
    });

  writeDesignSystem = async (
    owner: DesignSystemOwner,
    request: WriteDesignSystemRequest,
  ): Promise<WriteDesignSystemResult> => {
    const assetRecords = [
      toLogoAssetRecord({
        ownerUserId: owner.ownerUserId,
        designSystemId: request.designSystem.id,
        asset: request.brandKit.logo,
      }),
      ...(request.brandKit.decorativeAssets ?? []).map((asset, index) =>
        toDecorativeAssetRecord({
          ownerUserId: owner.ownerUserId,
          designSystemId: request.designSystem.id,
          asset,
          sortOrder: index + 1,
        }),
      ),
    ];

    const action = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.designSystem.findUnique({
        where: {
          ownerUserId_slug: { ownerUserId: owner.ownerUserId, slug: request.designSystem.id },
        },
        select: { id: true },
      });
      const designSystem = await tx.designSystem.upsert({
        where: {
          ownerUserId_slug: { ownerUserId: owner.ownerUserId, slug: request.designSystem.id },
        },
        create: {
          ownerUserId: owner.ownerUserId,
          slug: request.designSystem.id,
          schemaVersion: 1,
          name: request.designSystem.name,
          description: request.designSystem.description,
        },
        update: { name: request.designSystem.name, description: request.designSystem.description },
      });
      await tx.brandKit.deleteMany({ where: { designSystemId: designSystem.id } });
      await tx.presentationKit.deleteMany({ where: { designSystemId: designSystem.id } });
      await tx.brandKit.create({
        data: {
          designSystemId: designSystem.id,
          colors: {
            create: request.brandKit.colors.map((color, index) => ({
              tokenId: color.id,
              name: color.name,
              value: color.value,
              description: color.description,
              sortOrder: index,
            })),
          },
          assets: { create: assetRecords },
        },
      });
      await tx.presentationKit.create({
        data: {
          designSystemId: designSystem.id,
          canvasWidth: request.presentationKit.canvas.width,
          canvasHeight: request.presentationKit.canvas.height,
          canvasUnit: request.presentationKit.canvas.unit,
          designPrompt: request.presentationKit.designPrompt,
        },
      });
      return existing ? "updated" : "created";
    });

    return {
      designSystemId: request.designSystem.id,
      action,
      designSystem: await this.getDesignSystem(owner, request.designSystem.id),
    };
  };
}
