import type { BrandKitAsset as DbBrandKitAsset } from "@prisma/client";
import { decorativeAssetHandle, type BrandKitDecorativeAsset } from "../decorative-assets/index";
import { LOGO_ASSET_HANDLE, type BrandKitVisualAsset } from "../logo/index";
import { brandKitAssetFileObjectKey } from "./object-key";
import { asSupportedBrandKitAssetMimeType } from "./rules";

export const BRAND_KIT_ASSETS_ORDER_BY = { sortOrder: "asc" } as const;

export class InvalidBrandGuideAssetUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidBrandGuideAssetUploadError";
  }
}

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

export type BrandKitAssetFileRecordInput =
  | Readonly<{
      kind: "LOGO";
      ownerUserId: string;
      brandGuideId: string;
      asset: WritableBrandKitAssetRecord & Readonly<{ assetId: string }>;
    }>
  | Readonly<{
      kind: "DECORATIVE_ASSET";
      ownerUserId: string;
      brandGuideId: string;
      asset: WritableBrandKitAssetRecord & Readonly<{ id: string }>;
      sortOrder: number;
    }>;

export type WritableBrandKitAssetFileRecord = BrandKitAssetRecord &
  WritableBrandKitAssetRecord &
  Readonly<{ byteSize: number; sha256: string }>;

export type BrandKitAssetFileView = BrandKitVisualAsset | BrandKitDecorativeAsset;

export const toBrandKitAssetFileRecord = (
  input: BrandKitAssetFileRecordInput,
): WritableBrandKitAssetFileRecord => {
  const assetId = input.kind === "LOGO" ? input.asset.assetId : input.asset.id;
  const assetRecord: WritableBrandKitAssetRecord = {
    name: input.asset.name,
    filename: input.asset.filename,
    mimeType: input.asset.mimeType,
    description: input.asset.description,
    s3Key: input.asset.s3Key,
    byteSize: input.asset.byteSize,
    sha256: input.asset.sha256,
  };
  const expectedS3Key = brandKitAssetFileObjectKey({
    ownerUserId: input.ownerUserId,
    brandGuideId: input.brandGuideId,
    assetId,
    filename: input.asset.filename,
  });
  if (input.asset.s3Key !== expectedS3Key) {
    throw new InvalidBrandGuideAssetUploadError(
      `Brand Guide asset '${assetId}' must reference prepared upload key '${expectedS3Key}'`,
    );
  }

  return {
    ...assetRecord,
    assetId,
    kind: input.kind,
    sortOrder: input.kind === "LOGO" ? 0 : input.sortOrder,
  };
};

export const toBrandKitAssetFileView = (asset: BrandKitAssetRecord): BrandKitAssetFileView =>
  asset.kind === "LOGO"
    ? {
        name: asset.name,
        assetHandle: brandKitAssetHandle(asset),
        filename: asset.filename,
        mimeType: asSupportedBrandKitAssetMimeType(asset.mimeType),
        description: asset.description,
      }
    : {
        id: asset.assetId,
        name: asset.name,
        assetHandle: brandKitAssetHandle(asset),
        filename: asset.filename,
        mimeType: asSupportedBrandKitAssetMimeType(asset.mimeType),
        description: asset.description,
      };

export const brandKitAssetHandle = (
  asset: Readonly<Pick<BrandKitAssetRecord, "kind" | "assetId">>,
): string => (asset.kind === "LOGO" ? LOGO_ASSET_HANDLE : decorativeAssetHandle(asset.assetId));
