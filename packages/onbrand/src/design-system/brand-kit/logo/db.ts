import { InvalidDesignSystemAssetUploadError } from "../../application-service";
import { LOGO_ASSET_HANDLE, type BrandKitVisualAsset } from "../logo/index";
import { brandKitAssetFileObjectKey } from "../asset-file/object-key";
import {
  asSupportedBrandKitAssetMimeType,
  type StoredBrandKitAsset,
  type WritableStoredBrandKitAsset,
} from "../asset-file/db";

export const toStoredLogoAssetRecord = ({
  ownerUserId,
  designSystemId,
  asset,
}: {
  ownerUserId: string;
  designSystemId: string;
  asset: WritableStoredBrandKitAsset & Readonly<{ assetId: string }>;
}): StoredBrandKitAsset &
  WritableStoredBrandKitAsset &
  Readonly<{ byteSize: number; sha256: string }> => {
  const expectedS3Key = brandKitAssetFileObjectKey({
    ownerUserId,
    designSystemId,
    assetId: asset.assetId,
    filename: asset.filename,
  });
  if (asset.s3Key !== expectedS3Key) {
    throw new InvalidDesignSystemAssetUploadError(
      `Design System asset '${asset.assetId}' must reference prepared upload key '${expectedS3Key}'`,
    );
  }
  return { ...asset, assetId: asset.assetId, kind: "LOGO", sortOrder: 0 };
};

export const toLogoView = (logo: StoredBrandKitAsset): BrandKitVisualAsset => ({
  name: logo.name,
  assetHandle: LOGO_ASSET_HANDLE,
  filename: logo.filename,
  mimeType: asSupportedBrandKitAssetMimeType(logo.mimeType),
  description: logo.description,
});
