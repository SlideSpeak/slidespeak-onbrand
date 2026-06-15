import path from "node:path";
import type { S3 } from "@onbrand/s3";
import { decorativeAssetHandle } from "../decorative-assets/index";
import { LOGO_ASSET_HANDLE } from "../logo/index";
import type { BrandKitAssetDownload, SupportedAssetMimeType } from "../asset-file/index";

export const brandKitAssetsPrismaOrderBy = { sortOrder: "asc" } as const;

export type StoredBrandKitAsset = Readonly<{
  assetId: string;
  kind: "LOGO" | "DECORATIVE_ASSET";
  name: string;
  filename: string;
  mimeType: string;
  description: string;
  s3Key: string;
  sortOrder: number;
}>;

export type WritableStoredBrandKitAsset = Readonly<{
  name: string;
  filename: string;
  mimeType: string;
  description: string;
  s3Key: string;
  byteSize: number;
  sha256: string;
}>;

export const toBrandKitAssetDownload = async ({
  s3,
  bucket,
  expiresInSeconds,
  outputDirectory,
  asset,
}: {
  s3: Pick<typeof S3, "getPresigned">;
  bucket: string;
  expiresInSeconds: number;
  outputDirectory: string;
  asset: StoredBrandKitAsset;
}): Promise<BrandKitAssetDownload> => {
  const targetPath = joinOutputPath(outputDirectory, asset.filename);
  const common = {
    assetHandle: brandKitAssetHandle(asset),
    name: asset.name,
    filename: asset.filename,
    mimeType: asSupportedBrandKitAssetMimeType(asset.mimeType),
    downloadUrl: await s3.getPresigned({
      bucket,
      key: asset.s3Key,
      filename: asset.filename,
      contentType: asset.mimeType,
      expiresInSeconds,
    }),
    targetPath,
    ...(path.posix.isAbsolute(outputDirectory) ? {} : { relativePath: targetPath }),
  } as const;

  return asset.kind === "LOGO"
    ? { ...common, kind: "LOGO" }
    : { ...common, kind: "DECORATIVE_ASSET", id: asset.assetId };
};

export const asSupportedBrandKitAssetMimeType = (mimeType: string): SupportedAssetMimeType => {
  if (
    mimeType === "image/svg+xml" ||
    mimeType === "image/png" ||
    mimeType === "image/jpeg" ||
    mimeType === "image/webp"
  ) {
    return mimeType;
  }
  throw new Error(`Unsupported stored Brand Kit asset MIME type: ${mimeType}`);
};

const brandKitAssetHandle = (asset: StoredBrandKitAsset): string =>
  asset.kind === "LOGO" ? LOGO_ASSET_HANDLE : decorativeAssetHandle(asset.assetId);

const joinOutputPath = (outputDirectory: string, filename: string): string =>
  outputDirectory === "." ? filename : path.posix.join(outputDirectory, filename);
