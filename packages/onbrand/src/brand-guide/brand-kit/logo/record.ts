import { InvalidBrandGuideAssetUploadError } from "../../application-service";
import { LOGO_ASSET_HANDLE, type BrandKitVisualAsset } from "../logo/index";
import { brandKitAssetFileObjectKey } from "../asset-file/object-key";
import {
  asSupportedBrandKitAssetMimeType,
  type BrandKitAssetRecord,
  type WritableBrandKitAssetRecord,
} from "../asset-file/record";

export const toLogoAssetRecord = ({
  ownerUserId,
  brandGuideId,
  asset,
}: {
  ownerUserId: string;
  brandGuideId: string;
  asset: WritableBrandKitAssetRecord & Readonly<{ assetId: string }>;
}): BrandKitAssetRecord &
  WritableBrandKitAssetRecord &
  Readonly<{ byteSize: number; sha256: string }> => {
  const expectedS3Key = brandKitAssetFileObjectKey({
    ownerUserId,
    brandGuideId,
    assetId: asset.assetId,
    filename: asset.filename,
  });
  if (asset.s3Key !== expectedS3Key) {
    throw new InvalidBrandGuideAssetUploadError(
      `Brand Guide asset '${asset.assetId}' must reference prepared upload key '${expectedS3Key}'`,
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
