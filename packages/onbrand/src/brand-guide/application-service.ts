import type { BrandGuideOwner } from "./owner";
import type { BrandKitAssetMaterializationPlan } from "./brand-kit/asset-file/index";
import type { BrandKitView } from "./brand-kit/index";
import type { BrandGuideSummary } from "./brand-guide";
import type { PresentationKitView } from "./presentation-kit/presentation-kit";

export type { BrandGuideSummary } from "./brand-guide";
export type {
  BrandKitAssetDownload,
  BrandKitAssetMaterializationPlan,
  SupportedAssetMimeType,
} from "./brand-kit/asset-file/index";
export type { BrandKitDecorativeAsset } from "./brand-kit/decorative-assets/index";
export type { BrandKitView } from "./brand-kit/index";
export type { BrandKitVisualAsset } from "./brand-kit/logo/index";
export type { ColorToken } from "./brand-kit/color/index";
export type { PresentationKitView } from "./presentation-kit/presentation-kit";

export class UnknownBrandGuideError extends Error {
  constructor(readonly brandGuideId: string) {
    super(`Unknown Brand Guide: ${brandGuideId}`);
    this.name = "UnknownBrandGuideError";
  }
}

export class InvalidBrandGuideAssetUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidBrandGuideAssetUploadError";
  }
}

export type BrandGuideView = Readonly<{
  brandGuide: BrandGuideSummary;
  brandKit: BrandKitView;
  presentationKit: PresentationKitView;
}>;

export type MaterializeBrandKitAssetsRequest = Readonly<{
  brandGuideId: string;
  outputDirectory: string;
}>;

export type GetBrandKitAssetPreviewUrlRequest = Readonly<{
  brandGuideId: string;
  assetHandle: string;
}>;

export type PrepareBrandGuideAssetUpload = Readonly<{
  assetId: string;
  filename: string;
  mimeType: "image/svg+xml" | "image/png" | "image/jpeg" | "image/webp";
  byteSize: number;
  sha256: string;
}>;

export type PreparedBrandGuideAssetUpload = PrepareBrandGuideAssetUpload &
  Readonly<{
    s3Key: string;
    uploadUrl: string;
    expiresInSeconds: number;
    method: "PUT";
    headers: Readonly<{ "Content-Type": string }>;
    command: string;
  }>;

export type PrepareBrandGuideAssetUploadsRequest = Readonly<{
  brandGuideId: string;
  uploads: readonly PrepareBrandGuideAssetUpload[];
}>;

export type PrepareBrandGuideAssetUploadsResult = Readonly<{
  brandGuideId: string;
  instructions: string;
  uploads: readonly PreparedBrandGuideAssetUpload[];
}>;

export type WriteBrandGuideAsset = Readonly<{
  name: string;
  filename: string;
  mimeType: "image/svg+xml" | "image/png" | "image/jpeg" | "image/webp";
  description: string;
  s3Key: string;
  byteSize: number;
  sha256: string;
}>;

export type WriteBrandGuideLogoAsset = WriteBrandGuideAsset & Readonly<{ assetId: string }>;

export type WriteBrandGuideMetadata = Readonly<{
  id: string;
  name: string;
  description: string;
}>;

export type WriteBrandGuideRequest = Readonly<{
  brandGuide: WriteBrandGuideMetadata;
  brandKit: Omit<BrandKitView, "logo" | "decorativeAssets"> &
    Readonly<{
      logo: WriteBrandGuideLogoAsset;
      decorativeAssets?: readonly (WriteBrandGuideAsset & Readonly<{ id: string }>)[];
    }>;
  presentationKit: PresentationKitView;
}>;

export type WriteBrandGuideResult = Readonly<{
  brandGuideId: string;
  action: "CREATED" | "UPDATED";
  brandGuide: BrandGuideView;
}>;

export interface BrandGuideApplicationService {
  listBrandGuides(owner: BrandGuideOwner): Promise<readonly BrandGuideSummary[]>;
  getBrandGuide(owner: BrandGuideOwner, brandGuideId: string): Promise<BrandGuideView>;
  prepareBrandGuideAssetUploads(
    owner: BrandGuideOwner,
    request: PrepareBrandGuideAssetUploadsRequest,
  ): Promise<PrepareBrandGuideAssetUploadsResult>;
  materializeBrandKitAssets(
    owner: BrandGuideOwner,
    request: MaterializeBrandKitAssetsRequest,
  ): Promise<BrandKitAssetMaterializationPlan>;
  getBrandKitAssetPreviewUrl(
    owner: BrandGuideOwner,
    request: GetBrandKitAssetPreviewUrlRequest,
  ): Promise<string>;
  writeBrandGuide(
    owner: BrandGuideOwner,
    request: WriteBrandGuideRequest,
  ): Promise<WriteBrandGuideResult>;
}
