import { z } from "zod";
import { UnknownBrandGuideError } from "@onbrand/core/brand-guide/application-service";
import { readMarkdownAsString } from "@onbrand/file";
import { registerScopedTool } from "../shared/register-scoped-tool";
import { type ToolRegistrationContext } from "../shared/types";

export const registerGetBrandGuideTool = (context: ToolRegistrationContext): void => {
  registerScopedTool({
    context,
    name: "get_brand_guide",
    scope: "onbrand:read",
    handledErrors: [UnknownBrandGuideError],
    config: {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
      inputSchema: {
        brandGuideId: z.string().describe("Brand Guide id."),
      },
    },
    handler: ({ brandGuideId }) =>
      context.brandGuides.getBrandGuide(context.brandGuideOwner, brandGuideId),
  });
};
