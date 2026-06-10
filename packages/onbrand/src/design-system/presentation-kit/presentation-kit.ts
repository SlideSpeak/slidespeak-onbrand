import { integerSchema, positiveIntegerSchema } from "@onbrand/number";
import { slugSchema } from "@onbrand/string";
import { z } from "zod";

export const placementSchema = z
  .object({
    x: integerSchema,
    y: integerSchema,
    width: positiveIntegerSchema,
    height: positiveIntegerSchema,
  })
  .strict();

export type Placement = Readonly<z.infer<typeof placementSchema>>;

export const slideCanvasSchema = z
  .object({
    width: positiveIntegerSchema,
    height: positiveIntegerSchema,
    unit: z.literal("px"),
  })
  .strict();

export const usagePolicySchema = z.enum(["required", "optional"]);

export const textStyleSchema = z
  .object({
    fontSize: positiveIntegerSchema,
    fontWeight: positiveIntegerSchema,
    colorTokenId: slugSchema,
  })
  .strict();

export const shapeStyleSchema = z
  .object({
    fillColorTokenId: slugSchema,
  })
  .strict();

const persistentElementBaseSchema = z.object({
  id: slugSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  usagePolicy: usagePolicySchema,
  placement: placementSchema,
});

export const logoPersistentElementSchema = persistentElementBaseSchema
  .extend({
    kind: z.literal("logo"),
  })
  .strict();

export const slideNumberPersistentElementSchema = persistentElementBaseSchema
  .extend({
    kind: z.literal("slideNumber"),
    textStyle: textStyleSchema,
  })
  .strict();

export const textPersistentElementSchema = persistentElementBaseSchema
  .extend({
    kind: z.literal("text"),
    text: z.string().min(1),
    textStyle: textStyleSchema,
  })
  .strict();

export const shapePersistentElementSchema = persistentElementBaseSchema
  .extend({
    kind: z.literal("shape"),
    shape: z.enum(["rectangle", "ellipse"]),
    shapeStyle: shapeStyleSchema,
  })
  .strict();

export const persistentLayoutElementSchema = z.discriminatedUnion("kind", [
  logoPersistentElementSchema,
  slideNumberPersistentElementSchema,
  textPersistentElementSchema,
  shapePersistentElementSchema,
]);

export type PersistentLayoutElement = Readonly<z.infer<typeof persistentLayoutElementSchema>>;

export const presentationKitSchema = z
  .object({
    canvas: slideCanvasSchema,
    persistentElements: z.array(persistentLayoutElementSchema),
  })
  .strict();

export type PresentationKit = Readonly<z.infer<typeof presentationKitSchema>>;

export const ensureUniquePersistentLayoutElementIds = (
  elements: readonly Pick<PersistentLayoutElement, "id">[],
  context: { designSystemId: string },
): void => {
  const seen = new Set<string>();
  for (const element of elements) {
    if (seen.has(element.id)) {
      throw new Error(
        `Duplicate Persistent Layout Element id '${element.id}' in Design System '${context.designSystemId}'`,
      );
    }
    seen.add(element.id);
  }
};
