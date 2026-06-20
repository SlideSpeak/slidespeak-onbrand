import type { SupportedAssetMimeType } from "./rules";

export {
  asSupportedBrandKitAssetMimeType,
  brandKitAssetFilePreviewPath,
  SUPPORTED_BRAND_KIT_ASSET_MIME_TYPES,
  type SupportedAssetMimeType,
} from "./rules";

export type BrandKitAssetDownload =
  | Readonly<{
      kind: "LOGO";
      assetHandle: string;
      name: string;
      filename: string;
      mimeType: SupportedAssetMimeType;
      downloadUrl: string;
      targetPath: string;
      relativePath?: string;
    }>
  | Readonly<{
      kind: "DECORATIVE_ASSET";
      id: string;
      assetHandle: string;
      name: string;
      filename: string;
      mimeType: SupportedAssetMimeType;
      downloadUrl: string;
      targetPath: string;
      relativePath?: string;
    }>;

export type BrandKitAssetMaterializationPlan = Readonly<{
  brandGuideId: string;
  outputDirectory: string;
  expiresInSeconds: number;
  instructions: string;
  commands: readonly string[];
  assets: readonly BrandKitAssetDownload[];
}>;
