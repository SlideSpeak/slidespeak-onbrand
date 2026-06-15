import { InvalidDesignSystemAssetUploadError } from "../../application-service";
import { decorativeAssetHandle, type BrandKitDecorativeAsset } from "../decorative-assets/index";
import { brandKitAssetFileObjectKey } from "../asset-file/object-key";
import {
  asSupportedBrandKitAssetMimeType,
  type BrandKitAssetRecord,
  type WritableBrandKitAssetRecord,
} from "../asset-file/record";

export const toDecorativeAssetRecord = ({
  ownerUserId,
  designSystemId,
  asset,
  sortOrder,
}: {
  ownerUserId: string;
  designSystemId: string;
  asset: WritableBrandKitAssetRecord & Readonly<{ id: string }>;
  sortOrder: number;
}): BrandKitAssetRecord &
  WritableBrandKitAssetRecord &
  Readonly<{ byteSize: number; sha256: string }> => {
  const expectedS3Key = brandKitAssetFileObjectKey({
    ownerUserId,
    designSystemId,
    assetId: asset.id,
    filename: asset.filename,
  });
  if (asset.s3Key !== expectedS3Key) {
    throw new InvalidDesignSystemAssetUploadError(
      `Design System asset '${asset.id}' must reference prepared upload key '${expectedS3Key}'`,
    );
  }
  return { ...asset, assetId: asset.id, kind: "DECORATIVE_ASSET", sortOrder };
};

export const toDecorativeAssetView = (asset: BrandKitAssetRecord): BrandKitDecorativeAsset => ({
  id: asset.assetId,
  name: asset.name,
  assetHandle: decorativeAssetHandle(asset.assetId),
  filename: asset.filename,
  mimeType: asSupportedBrandKitAssetMimeType(asset.mimeType),
  description: asset.description,
});
