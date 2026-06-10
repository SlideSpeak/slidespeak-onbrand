import { slugSchema } from "@onbrand/string";
import { z } from "zod";

export const colorTokenIdSchema = slugSchema;
export const hexColorValueSchema = z.string().regex(/^#[0-9A-F]{6}$/);

export const colorTokenSchema = z
  .object({
    id: colorTokenIdSchema,
    name: z.string().min(1),
    value: hexColorValueSchema,
    description: z.string().min(1),
  })
  .strict();

export type ColorToken = Readonly<z.infer<typeof colorTokenSchema>>;

export const colorTokensSchema = z.array(colorTokenSchema);

export const ensureUniqueColorTokenIds = (
  colors: readonly Pick<ColorToken, "id">[],
  context: { designSystemId: string },
): void => {
  const seen = new Set<string>();
  for (const color of colors) {
    if (seen.has(color.id)) {
      throw new Error(
        `Duplicate Color Token id '${color.id}' in Design System '${context.designSystemId}'`,
      );
    }
    seen.add(color.id);
  }
};
