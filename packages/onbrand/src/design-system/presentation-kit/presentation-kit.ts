import { positiveIntegerSchema } from "@onbrand/number";
import { z } from "zod";

export const slideCanvasSchema = z
  .object({
    width: positiveIntegerSchema,
    height: positiveIntegerSchema,
    unit: z.literal("px"),
  })
  .strict();

export type SlideCanvas = Readonly<z.infer<typeof slideCanvasSchema>>;

export const presentationKitSchema = z
  .object({
    canvas: slideCanvasSchema,
    designPrompt: z.string().min(1).optional(),
  })
  .strict();

export type PresentationKit = Readonly<z.infer<typeof presentationKitSchema>>;
