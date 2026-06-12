import type { AuthContext } from "../../auth/context";
import type { BrandKitAssetFiles, McpBrandKit } from "../brand-kit/asset";
import type { DesignSystem, DesignSystemSummary } from "../design-system";

export { UnknownBrandKitAssetError } from "../brand-kit/asset";
export type {
  BrandKitAssetFile,
  BrandKitAssetFiles,
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

export type McpPresentationKit = Omit<DesignSystem["presentationKit"], "designPrompt"> &
  Readonly<{ designPrompt?: string }>;

export type McpDesignSystem = Readonly<{
  designSystem: DesignSystemSummary;
  brandKit: McpBrandKit;
  presentationKit: McpPresentationKit;
}>;

export type GetBrandKitAssetFilesRequest = Readonly<{
  designSystemId: string;
  assetHandles?: readonly string[];
}>;

export interface DesignSystemRegistry {
  listDesignSystems(auth: AuthContext): Promise<readonly DesignSystemSummary[]>;
  getDesignSystem(auth: AuthContext, designSystemId: string): Promise<McpDesignSystem>;
  getBrandKitAssetFiles(
    auth: AuthContext,
    request: GetBrandKitAssetFilesRequest,
  ): Promise<BrandKitAssetFiles>;
}
