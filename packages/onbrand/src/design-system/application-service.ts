import type { DesignSystemOwner } from "./owner";
import type { BrandKitAssetMaterializationPlan, BrandKitView } from "./brand-kit/asset-file/index";
import type { DesignSystem, DesignSystemSummary } from "./design-system";

export type {
  BrandKitAssetDownload,
  BrandKitAssetMaterializationPlan,
  BrandKitView,
  BrandKitDecorativeAsset,
  BrandKitVisualAsset,
  SupportedAssetMimeType,
} from "./brand-kit/asset-file/index";

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

export type PresentationKitView = Omit<DesignSystem["presentationKit"], "designPrompt"> &
  Readonly<{ designPrompt?: string }>;

export type DesignSystemView = Readonly<{
  designSystem: DesignSystemSummary;
  brandKit: BrandKitView;
  presentationKit: PresentationKitView;
}>;

export type MaterializeBrandKitAssetsRequest = Readonly<{
  designSystemId: string;
  outputDirectory: string;
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
  action: "created" | "updated";
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
  writeDesignSystem(
    owner: DesignSystemOwner,
    request: WriteDesignSystemRequest,
  ): Promise<WriteDesignSystemResult>;
}
