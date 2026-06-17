export const assetPreviewUrl = ({
  designSystemId,
  assetHandle,
}: Readonly<{ designSystemId: string; assetHandle: string }>): string =>
  `/api/design-systems/${encodeURIComponent(designSystemId)}/assets/${encodeURIComponent(assetHandle)}/preview`;
