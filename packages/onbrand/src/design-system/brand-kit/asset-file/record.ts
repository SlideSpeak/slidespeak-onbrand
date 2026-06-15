import type { BrandKitAsset as DbBrandKitAsset } from "@prisma/client";
import type { SupportedAssetMimeType } from "./index";

export const brandKitAssetsOrderBy = { sortOrder: "asc" } as const;

export type BrandKitAssetRecord = Readonly<
  Pick<
    DbBrandKitAsset,
    "assetId" | "kind" | "name" | "filename" | "mimeType" | "description" | "s3Key" | "sortOrder"
  >
>;

export type WritableBrandKitAssetRecord = Readonly<
  Pick<
    DbBrandKitAsset,
    "name" | "filename" | "mimeType" | "description" | "s3Key" | "byteSize" | "sha256"
  >
>;

export const asSupportedBrandKitAssetMimeType = (mimeType: string): SupportedAssetMimeType => {
  if (
    mimeType === "image/svg+xml" ||
    mimeType === "image/png" ||
    mimeType === "image/jpeg" ||
    mimeType === "image/webp"
  ) {
    return mimeType;
  }
  throw new Error(`Unsupported Brand Kit Asset File record MIME type: ${mimeType}`);
};
