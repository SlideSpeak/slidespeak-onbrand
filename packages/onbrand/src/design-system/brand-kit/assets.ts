import { slugSchema } from "@onbrand/string";
import { z } from "zod";

export const brandAssetSchema = z
  .object({
    id: slugSchema,
    name: z.string().min(1),
    source: z.string().min(1),
    mediaType: z.string().min(1),
    content: z.string().min(1).optional(),
    description: z.string().min(1),
  })
  .strict();

export type BrandAsset = Readonly<z.infer<typeof brandAssetSchema>>;

export const brandAssetsSchema = z.array(brandAssetSchema);

export const ensureUniqueBrandAssetIds = (
  assets: readonly Pick<BrandAsset, "id">[],
  context: { designSystemId: string },
): void => {
  const seen = new Set<string>();
  for (const asset of assets) {
    if (seen.has(asset.id)) {
      throw new Error(
        `Duplicate Brand Asset id '${asset.id}' in Design System '${context.designSystemId}'`,
      );
    }
    seen.add(asset.id);
  }
};
