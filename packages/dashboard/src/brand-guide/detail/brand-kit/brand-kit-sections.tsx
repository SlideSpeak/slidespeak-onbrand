import type { BrandGuideView, BrandKitView } from "@onbrand/core/brand-guide/application-service";
import type { BrandGuideSection } from "../../navigation/brand-guide-sections";
import {
  DecorativeAssetsSection,
  LogoSection,
  type AssetLayout,
} from "./brand-kit-assets-sections";
import { ColorTokensSection } from "./color-tokens-section";

export const BrandKitSections = ({
  assetLayout,
  onAssetLayoutChange,
  brandKit,
  brandGuideId,
  section,
  onViewChange,
}: Readonly<{
  assetLayout?: AssetLayout;
  onAssetLayoutChange?: (assetLayout: AssetLayout) => void;
  brandKit: BrandKitView;
  brandGuideId: string;
  section: Extract<BrandGuideSection, "COLORS" | "LOGO" | "ASSETS">;
  onViewChange: (view: BrandGuideView) => void;
}>) => {
  switch (section) {
    case "COLORS":
      return <ColorTokensSection brandGuideId={brandGuideId} colors={brandKit.colors} onViewChange={onViewChange} />;
    case "LOGO":
      return <LogoSection key={brandKit.logo?.assetHandle ?? "empty-logo"} brandGuideId={brandGuideId} logo={brandKit.logo} onViewChange={onViewChange} />;
    case "ASSETS":
      return (
        <DecorativeAssetsSection
          assetLayout={assetLayout ?? "MASONRY"}
          onAssetLayoutChange={onAssetLayoutChange}
          decorativeAssets={brandKit.decorativeAssets}
          brandGuideId={brandGuideId}
          onViewChange={onViewChange}
        />
      );
  }
};
