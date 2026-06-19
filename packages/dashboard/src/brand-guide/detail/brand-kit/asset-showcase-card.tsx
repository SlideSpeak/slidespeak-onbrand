import { AssetPreview } from "./asset-preview";
import { AssetPreviewDialog } from "./asset-preview-dialog";
import { assetPreviewUrl } from "./asset-preview-url";
import type { AssetShowcase } from "./asset-showcase";

export const AssetShowcaseCard = ({
  asset,
  brandGuideId,
  onClick,
  previewEnabled = true,
}: Readonly<{
  asset: AssetShowcase;
  brandGuideId: string;
  onClick?: () => void;
  previewEnabled?: boolean;
}>) => {
  const previewUrl = assetPreviewUrl({ brandGuideId, assetHandle: asset.assetHandle });

  const button = (
    <button
      className="relative mb-2.5 block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-md border border-onbrand-charcoal/8 bg-transparent p-0 text-left transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-onbrand-blue-200 focus-visible:outline-none"
      type="button"
      onClick={onClick}
    >
      <AssetPreview alt={asset.description} src={previewUrl} />
    </button>
  );

  if (!previewEnabled) return button;
  return (
    <AssetPreviewDialog asset={asset} previewUrl={previewUrl}>
      {button}
    </AssetPreviewDialog>
  );
};
