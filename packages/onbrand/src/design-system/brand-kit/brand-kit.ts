import { z } from "zod";
import { colorTokensSchema } from "./colors";
import { logoSchema } from "./logos";

export const brandKitSchema = z
  .object({
    colors: colorTokensSchema,
    logo: logoSchema,
  })
  .strict();

export type BrandKit = Readonly<z.infer<typeof brandKitSchema>>;
