import type { BrandKitDecorativeAsset } from "@onbrand/core/design-system/application-service";

import type { AssetLayout } from "./asset-layout";
import { AssetShowcaseCard } from "./asset-showcase-card";
import { AssetShowcaseListItem } from "./asset-showcase-list-item";

export const DecorativeAssetsSection = ({
  assetLayout,
  decorativeAssets,
  designSystemId,
}: Readonly<{
  assetLayout: AssetLayout;
  decorativeAssets: readonly BrandKitDecorativeAsset[];
  designSystemId: string;
}>) => (
  <section id="assets" className="scroll-mt-4">
    {decorativeAssets.length === 0 ? (
      <p className="text-onbrand-charcoal/55">No Decorative Assets declared.</p>
    ) : assetLayout === "MASONRY" ? (
      <div className="columns-2 gap-2.5 md:columns-4 lg:columns-5">
        {decorativeAssets.map((asset) => (
          <AssetShowcaseCard key={asset.id} asset={asset} designSystemId={designSystemId} />
        ))}
      </div>
    ) : (
      <div className="grid gap-1.5 md:grid-cols-2">
        {decorativeAssets.map((asset) => (
          <AssetShowcaseListItem key={asset.id} asset={asset} designSystemId={designSystemId} />
        ))}
      </div>
    )}
  </section>
);
