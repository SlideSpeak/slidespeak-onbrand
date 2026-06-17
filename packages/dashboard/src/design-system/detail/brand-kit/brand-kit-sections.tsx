import type { BrandKitView } from "@onbrand/core/design-system/application-service";
import type { DesignSystemSection } from "../../navigation/design-system-sections";
import {
  DecorativeAssetsSection,
  LogoSection,
  type AssetLayout,
} from "./brand-kit-assets-sections";
import { ColorTokensSection } from "./color-tokens-section";

export const BrandKitSections = ({
  assetLayout,
  brandKit,
  designSystemId,
  section,
}: Readonly<{
  assetLayout?: AssetLayout;
  brandKit: BrandKitView;
  designSystemId: string;
  section: Extract<DesignSystemSection, "COLORS" | "LOGO" | "ASSETS">;
}>) => {
  switch (section) {
    case "COLORS":
      return <ColorTokensSection colors={brandKit.colors} />;
    case "LOGO":
      return <LogoSection designSystemId={designSystemId} logo={brandKit.logo} />;
    case "ASSETS":
      return (
        <DecorativeAssetsSection
          assetLayout={assetLayout ?? "MASONRY"}
          decorativeAssets={brandKit.decorativeAssets}
          designSystemId={designSystemId}
        />
      );
  }
};
