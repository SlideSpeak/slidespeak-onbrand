import { InvalidDesignSystemAssetUploadError } from "../../application-service";
import { LOGO_ASSET_HANDLE, type BrandKitVisualAsset } from "../logo/index";
import { brandKitAssetFileObjectKey } from "../asset-file/object-key";
import {
  asSupportedBrandKitAssetMimeType,
  type BrandKitAssetRecord,
  type WritableBrandKitAssetRecord,
} from "../asset-file/record";

export const toLogoAssetRecord = ({
  ownerUserId,
  designSystemId,
  asset,
}: {
  ownerUserId: string;
  designSystemId: string;
  asset: WritableBrandKitAssetRecord & Readonly<{ assetId: string }>;
}): BrandKitAssetRecord &
  WritableBrandKitAssetRecord &
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

export const toLogoView = (logo: BrandKitAssetRecord): BrandKitVisualAsset => ({
  name: logo.name,
  assetHandle: LOGO_ASSET_HANDLE,
  filename: logo.filename,
  mimeType: asSupportedBrandKitAssetMimeType(logo.mimeType),
  description: logo.description,
});
