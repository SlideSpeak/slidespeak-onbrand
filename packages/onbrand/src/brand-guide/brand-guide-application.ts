import { BrandKitAssetFileWorkflow } from "./brand-kit/asset-file/workflow";
import type { S3 } from "@onbrand/s3";
import type { PrismaClient } from "@prisma/client";
import type { BrandGuideOwner } from "./owner";
import type { BrandGuideSummary } from "./brand-guide";
import type { BrandKitAssetMaterializationPlan } from "./brand-kit/asset-file/index";
import { brandKitAssetHandle } from "./brand-kit/asset-file/record";
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
import { PrismaBrandGuideRegistry, type BrandGuideRegistry } from "./brand-guide-store";

export class PersistentBrandGuideApplication implements BrandGuideApplicationService {
  private readonly brandKitAssetFiles: BrandKitAssetFileWorkflow;
  private readonly brandGuides: BrandGuideRegistry;

  constructor(
    prisma: PrismaClient,
    s3: Pick<typeof S3, "getPresigned" | "putPresigned">,
    brandKitAssetBucket: string,
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

  writeBrandGuide = async (
    owner: BrandGuideOwner,
    request: WriteBrandGuideRequest,
  ): Promise<WriteBrandGuideResult> => this.brandGuides.replace(owner, request);
}
