import type { AuthContext } from "../../auth/context";
import type { BrandKitAssetMaterializationPlan, McpBrandKit } from "../brand-kit/asset";
import type { DesignSystem, DesignSystemSummary } from "../design-system";

export type {
  BrandKitAssetDownload,
  BrandKitAssetMaterializationPlan,
  McpBrandKit,
  McpDecorativeAsset,
  McpVisualAsset,
  SupportedAssetMimeType,
} from "../brand-kit/asset";

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

export type McpPresentationKit = Omit<DesignSystem["presentationKit"], "designPrompt"> &
  Readonly<{ designPrompt?: string }>;

export type McpDesignSystem = Readonly<{
  designSystem: DesignSystemSummary;
  brandKit: McpBrandKit;
  presentationKit: McpPresentationKit;
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
  brandKit: Omit<McpBrandKit, "logo" | "decorativeAssets"> &
    Readonly<{
      logo: WriteDesignSystemLogoAsset;
      decorativeAssets?: readonly (WriteDesignSystemAsset & Readonly<{ id: string }>)[];
    }>;
  presentationKit: McpPresentationKit;
}>;

export type WriteDesignSystemResult = Readonly<{
  designSystemId: string;
  action: "created" | "updated";
  designSystem: McpDesignSystem;
}>;

export interface DesignSystemRegistry {
  listDesignSystems(auth: AuthContext): Promise<readonly DesignSystemSummary[]>;
  getDesignSystem(auth: AuthContext, designSystemId: string): Promise<McpDesignSystem>;
  prepareDesignSystemAssetUploads(
    auth: AuthContext,
    request: PrepareDesignSystemAssetUploadsRequest,
  ): Promise<PrepareDesignSystemAssetUploadsResult>;
  materializeBrandKitAssets(
    auth: AuthContext,
    request: MaterializeBrandKitAssetsRequest,
  ): Promise<BrandKitAssetMaterializationPlan>;
  writeDesignSystem(
    auth: AuthContext,
    request: WriteDesignSystemRequest,
  ): Promise<WriteDesignSystemResult>;
}
