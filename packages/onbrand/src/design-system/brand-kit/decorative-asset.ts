import { z } from "zod";
import { slugSchema } from "@onbrand/string";

export const decorativeAssetSchema = z
  .object({
    id: slugSchema,
    name: z.string().min(1),
    source: z.string().min(1),
    description: z.string().min(1),
  })
  .strict();

export const decorativeAssetsSchema = z.array(decorativeAssetSchema).default([]);

export type DecorativeAsset = Readonly<z.infer<typeof decorativeAssetSchema>>;
