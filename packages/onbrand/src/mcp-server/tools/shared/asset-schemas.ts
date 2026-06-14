import { z } from "zod";

export const supportedAssetMimeTypeSchema = z.enum([
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export const uploadDeclarationSchema = z.object({
  assetId: z.string().min(1),
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
