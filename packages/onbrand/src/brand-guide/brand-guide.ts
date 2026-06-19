import { z } from "zod";
import { slugSchema } from "@onbrand/string";
import { brandKitSchema } from "./brand-kit/index";
import { presentationKitSchema } from "./presentation-kit/presentation-kit";

export const brandGuideIdSchema = slugSchema;

export const brandGuideSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: brandGuideIdSchema,
    name: z.string().min(1),
    description: z.string().min(1).nullable(),
    brandKit: brandKitSchema,
    presentationKit: presentationKitSchema,
  })
  .strict();

export type BrandGuide = Readonly<z.infer<typeof brandGuideSchema>>;

export type BrandGuideSummary = Readonly<Pick<BrandGuide, "id" | "name" | "description">>;
