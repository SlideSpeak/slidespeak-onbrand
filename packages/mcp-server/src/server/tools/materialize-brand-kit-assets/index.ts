import { z } from "zod";
import { UnknownBrandGuideError } from "@onbrand/core/brand-guide/application-service";
import { readMarkdownAsString } from "@onbrand/file";
import { registerScopedTool } from "../shared/register-scoped-tool";
import { type ToolRegistrationContext } from "../shared/types";

export const registerMaterializeBrandKitAssetsTool = (context: ToolRegistrationContext): void => {
  registerScopedTool({
    context,
    name: "materialize_brand_kit_assets",
    scope: "onbrand:read",
    handledErrors: [UnknownBrandGuideError],
    config: {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
      inputSchema: {
        brandGuideId: z.string().describe("Brand Guide id."),
        outputDirectory: z
          .string()
          .min(1)
          .default("assets")
          .describe(
            "Directory where the client should download asset files. Use a relative path such as 'assets' so generated HTML can reference returned relativePath values.",
          ),
      },
    },
    handler: ({ brandGuideId, outputDirectory }) =>
      context.brandGuides.materializeBrandKitAssets(context.brandGuideOwner, {
        brandGuideId,
        outputDirectory,
      }),
  });
};
