import { z } from "zod";

export const LOGO_ASSET_HANDLE = "LOGO";

export const logoSchema = z
  .object({
    name: z.string().min(1),
    source: z.string().min(1),
    description: z.string().min(1),
  })
  .strict();

export type Logo = Readonly<z.infer<typeof logoSchema>>;

export type BrandKitVisualAsset = Readonly<{
  name: string;
  assetHandle: string;
  filename: string;
  mimeType: "image/svg+xml" | "image/png" | "image/jpeg" | "image/webp";
  description: string;
}>;
