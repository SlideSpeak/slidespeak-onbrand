import { z } from "zod";
import { InvalidDesignSystemAssetUploadError } from "@onbrand/core/design-system/application-service";
import { readMarkdownAsString } from "@onbrand/file";
import { registerScopedTool } from "../shared/register-scoped-tool";
import { assetSlugSchema, writableAssetSchema } from "../shared/asset-schemas";
import { type ToolRegistrationContext } from "../shared/types";

export const registerWriteDesignSystemTool = (context: ToolRegistrationContext): void => {
  registerScopedTool({
    context,
    name: "write_design_system",
    scope: "onbrand:write",
    handledErrors: [InvalidDesignSystemAssetUploadError],
    config: {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
      inputSchema: {
        designSystem: z.object({
          id: z
            .string()
            .min(1)
            .regex(/^[a-z0-9][a-z0-9-]*$/)
            .describe("Stable slug, e.g. 'acme'."),
          name: z.string().min(1),
          description: z
            .string()
            .min(1)
            .describe(
              "Required description of what this Design System is for and how agents should use it.",
            ),
        }),
        brandKit: z.object({
          colors: z.array(
            z.object({
              id: z.string().min(1),
              name: z.string().min(1),
              value: z
                .string()
                .regex(/^#[0-9a-fA-F]{6}$/)
                .describe("Six-digit hex color. Put opacity/alpha guidance in description."),
              description: z.string().min(1),
            }),
          ),
          logo: writableAssetSchema
            .extend({ assetId: assetSlugSchema })
            .describe(
              "The exact governed logo file extracted from source material. assetId must match the lowercase asset slug used in prepare_design_system_asset_uploads for this logo file.",
            ),
          decorativeAssets: z
            .array(writableAssetSchema.extend({ id: assetSlugSchema }))
            .default([])
            .describe(
              "Optional exact decorative visual accents extracted from the source. Each id must be the lowercase asset slug used in prepare_design_system_asset_uploads.",
            ),
        }),
        presentationKit: z.object({
          canvas: z.object({
            width: z.number().int().positive(),
            height: z.number().int().positive(),
            unit: z.literal("px"),
          }),
          designPrompt: z.string().min(200).describe("Detailed slide-generation rules."),
        }),
      },
    },
    handler: (request) => context.designSystems.writeDesignSystem(context.authContext, request),
  });
};
