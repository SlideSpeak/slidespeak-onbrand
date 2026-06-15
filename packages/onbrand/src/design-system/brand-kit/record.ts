import type { BrandKitView } from "./asset-file/index";
import { brandKitAssetsOrderBy, type BrandKitAssetRecord } from "./asset-file/record";
import { colorTokensOrderBy, toColorToken, type ColorTokenRecord } from "./color/record";
import { toDecorativeAssetView } from "./decorative-assets/record";
import { toLogoView } from "./logo/record";

export const brandKitInclude = {
  colors: { orderBy: colorTokensOrderBy },
  assets: { orderBy: brandKitAssetsOrderBy },
} as const;

export const toBrandKitView = (
  assets: readonly BrandKitAssetRecord[],
  colors: readonly ColorTokenRecord[],
): BrandKitView => {
  const logo = assets.find((asset) => asset.kind === "LOGO");
  if (!logo) throw new Error("Design System record is missing its Logo");

  return {
    colors: colors.map(toColorToken),
    logo: toLogoView(logo),
    decorativeAssets: assets
      .filter((asset) => asset.kind === "DECORATIVE_ASSET")
      .map(toDecorativeAssetView),
  };
};
