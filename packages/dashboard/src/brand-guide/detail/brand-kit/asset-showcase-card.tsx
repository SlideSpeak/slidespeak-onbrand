import { AssetPreview } from "./asset-preview";
import { AssetPreviewDialog } from "./asset-preview-dialog";
import { assetPreviewUrl } from "./asset-preview-url";
import type { AssetShowcase } from "./asset-showcase";

export const AssetShowcaseCard = ({
  asset,
  brandGuideId,
}: Readonly<{ asset: AssetShowcase; brandGuideId: string }>) => {
  const previewUrl = assetPreviewUrl({ brandGuideId, assetHandle: asset.assetHandle });

  return (
    <AssetPreviewDialog asset={asset} previewUrl={previewUrl}>
      <button
        className="onbrand-asset-preview-surface relative mb-2.5 block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-md border border-onbrand-charcoal/8 p-0 text-left transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-onbrand-blue-200 focus-visible:outline-none"
        type="button"
      >
        <AssetPreview alt={asset.description} src={previewUrl} />
      </button>
    </AssetPreviewDialog>
  );
};
