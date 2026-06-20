import { z } from "zod";
import { colorTokensSchema } from "./color/index";
import { decorativeAssetsSchema, type BrandKitDecorativeAsset } from "./decorative-assets/index";
import { logoSchema, type BrandKitVisualAsset } from "./logo/index";

export const brandKitSchema = z
  .object({
    colors: colorTokensSchema,
    logo: logoSchema,
    decorativeAssets: decorativeAssetsSchema,
  })
  .strict();

export type BrandKit = Readonly<z.infer<typeof brandKitSchema>>;

export type BrandKitView = Readonly<
  Omit<BrandKit, "logo" | "decorativeAssets"> & {
    logo: BrandKitVisualAsset | null;
    decorativeAssets: readonly BrandKitDecorativeAsset[];
  }
>;
