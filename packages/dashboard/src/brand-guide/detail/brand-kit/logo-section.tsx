import type { BrandKitVisualAsset } from "@onbrand/core/brand-guide/application-service";

import { AssetShowcaseCard } from "./asset-showcase-card";

export const LogoSection = ({
  brandGuideId,
  logo,
}: Readonly<{ brandGuideId: string; logo: BrandKitVisualAsset }>) => (
  <section id="logo" className="scroll-mt-4">
    <div className="columns-2 gap-2.5 md:columns-4 lg:columns-5">
      <AssetShowcaseCard asset={logo} brandGuideId={brandGuideId} />
    </div>
  </section>
);
