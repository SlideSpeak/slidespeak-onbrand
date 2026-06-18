export type SupportedAssetMimeType = "image/svg+xml" | "image/png" | "image/jpeg" | "image/webp";

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
