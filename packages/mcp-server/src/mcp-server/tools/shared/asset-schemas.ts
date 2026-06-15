import { slugSchema } from "@onbrand/string";
import { z } from "zod";

export const supportedAssetMimeTypeSchema = z.enum([
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export const assetSlugSchema = slugSchema;

export const uploadDeclarationSchema = z.object({
  assetId: assetSlugSchema.describe(
    "Lowercase asset slug used in the S3 object key, e.g. primary-logo, hero-orb, or icon-1. Do not use consumer asset handles.",
  ),
  filename: z.string().min(1),
  mimeType: supportedAssetMimeTypeSchema,
  byteSize: z.number().int().positive(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
});

export const writableAssetSchema = z.object({
  name: z.string().min(1),
  filename: z.string().min(1),
  mimeType: supportedAssetMimeTypeSchema,
  description: z.string().min(1),
  s3Key: z.string().min(1),
  byteSize: z.number().int().positive(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
});
