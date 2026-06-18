export const assetPreviewUrl = ({
  brandGuideId,
  assetHandle,
}: Readonly<{ brandGuideId: string; assetHandle: string }>): string =>
  `/api/brand-guides/${encodeURIComponent(brandGuideId)}/assets/${encodeURIComponent(assetHandle)}/preview`;
