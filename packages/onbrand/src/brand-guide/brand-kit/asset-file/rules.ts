export const SUPPORTED_BRAND_KIT_ASSET_MIME_TYPES = [
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type SupportedAssetMimeType = (typeof SUPPORTED_BRAND_KIT_ASSET_MIME_TYPES)[number];

export const asSupportedBrandKitAssetMimeType = (mimeType: string): SupportedAssetMimeType => {
  if (isSupportedBrandKitAssetMimeType(mimeType)) return mimeType;
  throw new Error(`Unsupported Brand Kit Asset File record MIME type: ${mimeType}`);
};

export const brandKitAssetFilePreviewPath = ({
  brandGuideId,
  assetHandle,
}: Readonly<{ brandGuideId: string; assetHandle: string }>): string =>
  `/api/brand-guides/${encodeURIComponent(brandGuideId)}/assets/${encodeURIComponent(assetHandle)}/preview`;

const isSupportedBrandKitAssetMimeType = (mimeType: string): mimeType is SupportedAssetMimeType =>
  SUPPORTED_BRAND_KIT_ASSET_MIME_TYPES.some((supported) => supported === mimeType);
