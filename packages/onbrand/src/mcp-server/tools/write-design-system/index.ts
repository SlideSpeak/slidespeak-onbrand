import { z } from "zod";
import { requireScope } from "../../../auth/context";
import { readMarkdownAsString } from "@onbrand/file";
import { toToolResult } from "../shared/result";
import { writableAssetSchema } from "../shared/asset-schemas";
import { type ToolRegistrationContext } from "../shared/types";

export const registerWriteDesignSystemTool = ({
  server,
  registry,
  authContext,
}: ToolRegistrationContext): void => {
  server.registerTool(
    "write_design_system",
    {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
      inputSchema: {
        designSystem: z.object({
          id: z
            .string()
            .min(1)
            .regex(/^[a-z0-9][a-z0-9-]*$/)
            .describe("Stable slug, e.g. 'acme'."),
          name: z.string().min(1),
          description: z.string().min(1).optional(),
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
          logo: writableAssetSchema.describe(
            "The exact governed logo file extracted from source material.",
          ),
          decorativeAssets: z
            .array(writableAssetSchema.extend({ id: z.string().min(1) }))
            .default([])
            .describe("Optional exact decorative visual accents extracted from the source."),
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
    async (request) => {
      requireScope(authContext, "onbrand:write");
      return toToolResult(await registry.writeDesignSystem(authContext, request));
    },
  );
};
