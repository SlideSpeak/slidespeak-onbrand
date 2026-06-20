import type { BrandKitView } from "./index";
import {
  BRAND_KIT_ASSETS_ORDER_BY,
  toBrandKitAssetFileView,
  type BrandKitAssetRecord,
} from "./asset-file/record";
import { COLOR_TOKENS_ORDER_BY, toColorToken, type ColorTokenRecord } from "./color/record";
import type { BrandKitDecorativeAsset } from "./decorative-assets/index";

export const BRAND_KIT_INCLUDE = {
  colors: { orderBy: COLOR_TOKENS_ORDER_BY },
  assets: { orderBy: BRAND_KIT_ASSETS_ORDER_BY },
} as const;

export const toBrandKitView = (
  assets: readonly BrandKitAssetRecord[],
  colors: readonly ColorTokenRecord[],
): BrandKitView => {
  const logo = assets.find((asset) => asset.kind === "LOGO");
  if (!logo) throw new Error("Brand Guide record is missing its Logo");

  return {
    colors: colors.map(toColorToken),
    logo: toBrandKitAssetFileView(logo),
    decorativeAssets: assets
      .filter((asset) => asset.kind === "DECORATIVE_ASSET")
      .map((asset) => toBrandKitAssetFileView(asset) as BrandKitDecorativeAsset),
  };
};
