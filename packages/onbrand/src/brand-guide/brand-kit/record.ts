import type { BrandKitView } from "./index";
import { BRAND_KIT_ASSETS_ORDER_BY, type BrandKitAssetRecord } from "./asset-file/record";
import { COLOR_TOKENS_ORDER_BY, toColorToken, type ColorTokenRecord } from "./color/record";
import { toDecorativeAssetView } from "./decorative-assets/record";
import { toLogoView } from "./logo/record";

export const BRAND_KIT_INCLUDE = {
  colors: { orderBy: COLOR_TOKENS_ORDER_BY },
  assets: { orderBy: BRAND_KIT_ASSETS_ORDER_BY },
} as const;

export const toBrandKitView = (
  assets: readonly BrandKitAssetRecord[],
  colors: readonly ColorTokenRecord[],
): BrandKitView => {
  const logo = assets.find((asset) => asset.kind === "LOGO");

  return {
    colors: colors.map(toColorToken),
    logo: logo ? toLogoView(logo) : null,
    decorativeAssets: assets
      .filter((asset) => asset.kind === "DECORATIVE_ASSET")
      .map(toDecorativeAssetView),
  };
};
