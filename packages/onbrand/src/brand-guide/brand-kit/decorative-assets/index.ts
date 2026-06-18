import { slugSchema } from "@onbrand/string";
import { z } from "zod";

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

export type BrandKitDecorativeAsset = Readonly<{
  id: string;
  name: string;
  assetHandle: string;
  filename: string;
  mimeType: "image/svg+xml" | "image/png" | "image/jpeg" | "image/webp";
  description: string;
}>;

export const decorativeAssetHandle = (decorativeAssetId: string): string =>
  `DECORATIVE_ASSET_${decorativeAssetId.replaceAll("-", "_").toUpperCase()}`;
