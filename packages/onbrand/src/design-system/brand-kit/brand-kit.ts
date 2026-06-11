import { z } from "zod";
import { colorTokensSchema } from "./color";
import { logoSchema } from "./logo";

export const brandKitSchema = z
  .object({
    colors: colorTokensSchema,
    logo: logoSchema,
  })
  .strict();

export type BrandKit = Readonly<z.infer<typeof brandKitSchema>>;
