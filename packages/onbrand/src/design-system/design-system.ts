import { z } from "zod";
import { slugSchema } from "@onbrand/string";
import { brandKitSchema } from "./brand-kit/brand-kit";

export const designSystemIdSchema = slugSchema;

export const designSystemSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: designSystemIdSchema,
    name: z.string().min(1),
    description: z.string().min(1).optional(),
    brandKit: brandKitSchema,
  })
  .strict();

export type DesignSystem = Readonly<z.infer<typeof designSystemSchema>>;

export type DesignSystemSummary = Readonly<Pick<DesignSystem, "id" | "name" | "description">>;
