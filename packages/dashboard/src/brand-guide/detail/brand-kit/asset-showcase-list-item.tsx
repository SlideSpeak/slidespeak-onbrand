import { AssetPreview } from "./asset-preview";
import { AssetPreviewDialog } from "./asset-preview-dialog";
import { assetPreviewUrl } from "./asset-preview-url";
import type { AssetShowcase } from "./asset-showcase";

export const AssetShowcaseListItem = ({
  asset,
  brandGuideId,
}: Readonly<{ asset: AssetShowcase; brandGuideId: string }>) => {
  const previewUrl = assetPreviewUrl({ brandGuideId, assetHandle: asset.assetHandle });

  return (
    <AssetPreviewDialog asset={asset} previewUrl={previewUrl}>
      <button
        className="grid w-full cursor-pointer grid-cols-[56px_minmax(0,1fr)] items-center gap-3 rounded-md border border-onbrand-charcoal/8 p-1.5 text-left transition hover:border-onbrand-charcoal/14 focus-visible:ring-2 focus-visible:ring-onbrand-blue-200 focus-visible:outline-none"
        type="button"
      >
        <AssetPreview
          alt={asset.description}
          className="onbrand-asset-preview-surface h-14 w-14 rounded-sm object-cover"
          src={previewUrl}
        />
        <span className="min-w-0">
          <span className="block truncate text-sm leading-5 font-normal text-onbrand-charcoal">
            {asset.name}
          </span>
          <span className="mt-0.5 block truncate text-xs leading-4 text-onbrand-charcoal/55">
            {asset.description}
          </span>
        </span>
      </button>
    </AssetPreviewDialog>
  );
};
