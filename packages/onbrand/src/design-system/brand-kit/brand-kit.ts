import { z } from "zod";
import { colorTokensSchema } from "./color";
import { decorativeAssetsSchema } from "./decorative-asset";
import { logoSchema } from "./logo";

export const brandKitSchema = z
  .object({
    colors: colorTokensSchema,
    logo: logoSchema,
    decorativeAssets: decorativeAssetsSchema,
  })
  .strict();

export type BrandKit = Readonly<z.infer<typeof brandKitSchema>>;
