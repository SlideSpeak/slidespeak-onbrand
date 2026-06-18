import { readMarkdownAsString } from "@onbrand/file";
import { registerScopedTool } from "../shared/register-scoped-tool";
import { type ToolRegistrationContext } from "../shared/types";

export const registerListBrandGuidesTool = (context: ToolRegistrationContext): void => {
  registerScopedTool({
    context,
    name: "list_brand_guides",
    scope: "onbrand:read",
    config: {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
      inputSchema: {},
    },
    handler: async () => ({
      brandGuides: await context.brandGuides.listBrandGuides(context.brandGuideOwner),
    }),
  });
};
