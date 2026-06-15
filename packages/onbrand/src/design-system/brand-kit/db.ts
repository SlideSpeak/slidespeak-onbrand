import type { BrandKitView } from "./asset-file/index";
import { brandKitAssetsPrismaOrderBy, type StoredBrandKitAsset } from "./asset-file/db";
import { colorTokensPrismaOrderBy, toColorToken, type StoredColorToken } from "./color/db";
import { toDecorativeAssetView } from "./decorative-assets/db";
import { toLogoView } from "./logo/db";

export const brandKitPrismaInclude = {
  colors: { orderBy: colorTokensPrismaOrderBy },
  assets: { orderBy: brandKitAssetsPrismaOrderBy },
} as const;

export const toBrandKitView = (
  assets: readonly StoredBrandKitAsset[],
  colors: readonly StoredColorToken[],
): BrandKitView => {
  const logo = assets.find((asset) => asset.kind === "LOGO");
  if (!logo) throw new Error("Stored Design System is missing its Logo");

  return {
    colors: colors.map(toColorToken),
    logo: toLogoView(logo),
    decorativeAssets: assets
      .filter((asset) => asset.kind === "DECORATIVE_ASSET")
      .map(toDecorativeAssetView),
  };
};
