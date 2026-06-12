import type { AuthContext } from "../../auth/context";
import type { BrandKitAssetMaterializationPlan, McpBrandKit } from "../brand-kit/asset";
import type { DesignSystem, DesignSystemSummary } from "../design-system";

export { UnknownBrandKitAssetError, UnmaterializedBrandKitAssetError } from "../brand-kit/asset";
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
  assetHandles?: readonly string[];
}>;

export interface DesignSystemRegistry {
  listDesignSystems(auth: AuthContext): Promise<readonly DesignSystemSummary[]>;
  getDesignSystem(auth: AuthContext, designSystemId: string): Promise<McpDesignSystem>;
  materializeBrandKitAssets(
    auth: AuthContext,
    request: MaterializeBrandKitAssetsRequest,
  ): Promise<BrandKitAssetMaterializationPlan>;
}
