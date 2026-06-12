export class UnknownBrandKitAssetError extends Error {
  constructor(
    readonly designSystemId: string,
    readonly assetHandle: string,
  ) {
    super(`Unknown Brand Kit asset '${assetHandle}' in Design System '${designSystemId}'`);
    this.name = "UnknownBrandKitAssetError";
  }
}

export type SupportedAssetMimeType = "image/svg+xml" | "image/png" | "image/jpeg" | "image/webp";

export type McpVisualAsset = Readonly<{
  name: string;
  assetHandle: string;
  filename: string;
  mimeType: SupportedAssetMimeType;
  description: string;
}>;

export type McpDecorativeAsset = Readonly<{
  id: string;
  name: string;
  assetHandle: string;
  filename: string;
  mimeType: SupportedAssetMimeType;
  description: string;
}>;

export type McpBrandKit = Readonly<{
  colors: readonly Readonly<{
    id: string;
    name: string;
    value: string;
    description: string;
  }>[];
  logo: McpVisualAsset;
  decorativeAssets: readonly McpDecorativeAsset[];
}>;

export type BrandKitAssetFile =
  | Readonly<{
      kind: "LOGO";
      assetHandle: string;
      name: string;
      filename: string;
      mimeType: SupportedAssetMimeType;
      contentBase64: string;
    }>
  | Readonly<{
      kind: "DECORATIVE_ASSET";
      id: string;
      assetHandle: string;
      name: string;
      filename: string;
      mimeType: SupportedAssetMimeType;
      contentBase64: string;
    }>;

export type BrandKitAssetFiles = Readonly<{
  designSystemId: string;
  assets: readonly BrandKitAssetFile[];
}>;
