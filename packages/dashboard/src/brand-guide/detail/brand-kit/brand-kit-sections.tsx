import type { BrandKitView } from "@onbrand/core/brand-guide/application-service";
import type { BrandGuideSection } from "../../navigation/brand-guide-sections";
import {
  DecorativeAssetsSection,
  LogoSection,
  type AssetLayout,
} from "./brand-kit-assets-sections";
import { ColorTokensSection } from "./color-tokens-section";

export const BrandKitSections = ({
  assetLayout,
  brandKit,
  brandGuideId,
  section,
}: Readonly<{
  assetLayout?: AssetLayout;
  brandKit: BrandKitView;
  brandGuideId: string;
  section: Extract<BrandGuideSection, "COLORS" | "LOGO" | "ASSETS">;
}>) => {
  switch (section) {
    case "COLORS":
      return <ColorTokensSection colors={brandKit.colors} />;
    case "LOGO":
      return <LogoSection brandGuideId={brandGuideId} logo={brandKit.logo} />;
    case "ASSETS":
      return (
        <DecorativeAssetsSection
          assetLayout={assetLayout ?? "MASONRY"}
          decorativeAssets={brandKit.decorativeAssets}
          brandGuideId={brandGuideId}
        />
      );
  }
};
