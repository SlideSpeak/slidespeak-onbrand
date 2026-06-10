import { z } from "zod";
import { brandAssetsSchema } from "./assets";
import { colorTokensSchema } from "./colors";
import { logoSchema } from "./logos";

export const brandKitSchema = z
  .object({
    colors: colorTokensSchema,
    logo: logoSchema,
    assets: brandAssetsSchema.optional().default([]),
    designPrompt: z.string().min(1),
  })
  .strict();

export type BrandKit = Readonly<z.infer<typeof brandKitSchema>>;
