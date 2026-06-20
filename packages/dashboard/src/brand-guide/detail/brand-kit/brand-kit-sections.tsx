import type { BrandGuideView, BrandKitView } from "@onbrand/core/brand-guide/application-service";
import type { BrandGuideEditor } from "../brand-guide-editor";
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
  editor,
  section,
  onViewChange,
}: Readonly<{
  assetLayout?: AssetLayout;
  onAssetLayoutChange?: (assetLayout: AssetLayout) => void;
  brandKit: BrandKitView;
  brandGuideId: string;
  editor: BrandGuideEditor;
  section: Extract<BrandGuideSection, "COLORS" | "LOGO" | "ASSETS">;
  onViewChange: (view: BrandGuideView) => void;
}>) => {
  switch (section) {
    case "COLORS":
      return (
        <ColorTokensSection editor={editor} colors={brandKit.colors} onViewChange={onViewChange} />
      );
    case "LOGO":
      return (
        <LogoSection
          key={brandKit.logo?.assetHandle ?? "empty-logo"}
          brandGuideId={brandGuideId}
          editor={editor}
          logo={brandKit.logo}
          onViewChange={onViewChange}
        />
      );
    case "ASSETS":
      return (
        <DecorativeAssetsSection
          assetLayout={assetLayout ?? "MASONRY"}
          onAssetLayoutChange={onAssetLayoutChange}
          decorativeAssets={brandKit.decorativeAssets}
          brandGuideId={brandGuideId}
          editor={editor}
          onViewChange={onViewChange}
        />
      );
  }
};
