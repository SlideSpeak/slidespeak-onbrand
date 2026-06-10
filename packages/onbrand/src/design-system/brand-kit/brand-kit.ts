import { z } from "zod";
import { colorTokensSchema } from "./colors";

export const brandKitSchema = z
  .object({
    colors: colorTokensSchema,
  })
  .strict();

export type BrandKit = Readonly<z.infer<typeof brandKitSchema>>;
