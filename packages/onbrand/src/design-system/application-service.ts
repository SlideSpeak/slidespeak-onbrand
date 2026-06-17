import type { DesignSystemOwner } from "./owner";
import type { BrandKitAssetMaterializationPlan } from "./brand-kit/asset-file/index";
import type { BrandKitView } from "./brand-kit/index";
import type { DesignSystemSummary } from "./design-system";
import type { PresentationKitView } from "./presentation-kit/presentation-kit";

export type { DesignSystemSummary } from "./design-system";
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

export class UnknownDesignSystemError extends Error {
  constructor(readonly designSystemId: string) {
    super(`Unknown Design System: ${designSystemId}`);
    this.name = "UnknownDesignSystemError";
  }
}

export class InvalidDesignSystemAssetUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDesignSystemAssetUploadError";
  }
}

export type DesignSystemView = Readonly<{
  designSystem: DesignSystemSummary;
  brandKit: BrandKitView;
  presentationKit: PresentationKitView;
}>;

export type MaterializeBrandKitAssetsRequest = Readonly<{
  designSystemId: string;
  outputDirectory: string;
}>;

export type GetBrandKitAssetPreviewUrlRequest = Readonly<{
  designSystemId: string;
  assetHandle: string;
}>;

export type PrepareDesignSystemAssetUpload = Readonly<{
  assetId: string;
  filename: string;
  mimeType: "image/svg+xml" | "image/png" | "image/jpeg" | "image/webp";
  byteSize: number;
  sha256: string;
}>;

export type PreparedDesignSystemAssetUpload = PrepareDesignSystemAssetUpload &
  Readonly<{
    s3Key: string;
    uploadUrl: string;
    expiresInSeconds: number;
    method: "PUT";
    headers: Readonly<{ "Content-Type": string }>;
    command: string;
  }>;

export type PrepareDesignSystemAssetUploadsRequest = Readonly<{
  designSystemId: string;
  uploads: readonly PrepareDesignSystemAssetUpload[];
}>;

export type PrepareDesignSystemAssetUploadsResult = Readonly<{
  designSystemId: string;
  instructions: string;
  uploads: readonly PreparedDesignSystemAssetUpload[];
}>;

export type WriteDesignSystemAsset = Readonly<{
  name: string;
  filename: string;
  mimeType: "image/svg+xml" | "image/png" | "image/jpeg" | "image/webp";
  description: string;
  s3Key: string;
  byteSize: number;
  sha256: string;
}>;

export type WriteDesignSystemLogoAsset = WriteDesignSystemAsset & Readonly<{ assetId: string }>;

export type WriteDesignSystemMetadata = Readonly<{
  id: string;
  name: string;
  description: string;
}>;

export type WriteDesignSystemRequest = Readonly<{
  designSystem: WriteDesignSystemMetadata;
  brandKit: Omit<BrandKitView, "logo" | "decorativeAssets"> &
    Readonly<{
      logo: WriteDesignSystemLogoAsset;
      decorativeAssets?: readonly (WriteDesignSystemAsset & Readonly<{ id: string }>)[];
    }>;
  presentationKit: PresentationKitView;
}>;

export type WriteDesignSystemResult = Readonly<{
  designSystemId: string;
  action: "CREATED" | "UPDATED";
  designSystem: DesignSystemView;
}>;

export interface DesignSystemApplicationService {
  listDesignSystems(owner: DesignSystemOwner): Promise<readonly DesignSystemSummary[]>;
  getDesignSystem(owner: DesignSystemOwner, designSystemId: string): Promise<DesignSystemView>;
  prepareDesignSystemAssetUploads(
    owner: DesignSystemOwner,
    request: PrepareDesignSystemAssetUploadsRequest,
  ): Promise<PrepareDesignSystemAssetUploadsResult>;
  materializeBrandKitAssets(
    owner: DesignSystemOwner,
    request: MaterializeBrandKitAssetsRequest,
  ): Promise<BrandKitAssetMaterializationPlan>;
  getBrandKitAssetPreviewUrl(
    owner: DesignSystemOwner,
    request: GetBrandKitAssetPreviewUrlRequest,
  ): Promise<string>;
  writeDesignSystem(
    owner: DesignSystemOwner,
    request: WriteDesignSystemRequest,
  ): Promise<WriteDesignSystemResult>;
}
