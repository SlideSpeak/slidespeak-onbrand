import { z } from "zod";
import { colorTokensSchema } from "./color/index";
import { decorativeAssetsSchema } from "./decorative-assets/index";
import { logoSchema } from "./logo/index";

export const brandKitSchema = z
  .object({
    colors: colorTokensSchema,
    logo: logoSchema,
    decorativeAssets: decorativeAssetsSchema,
  })
  .strict();

export type BrandKit = Readonly<z.infer<typeof brandKitSchema>>;
