import { readMarkdownAsString } from "@onbrand/file";
import { registerScopedTool } from "../shared/register-scoped-tool";
import { type ToolRegistrationContext } from "../shared/types";

export const registerListDesignSystemsTool = (context: ToolRegistrationContext): void => {
  registerScopedTool({
    context,
    name: "list_design_systems",
    scope: "onbrand:read",
    config: {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
      inputSchema: {},
    },
    handler: async () => ({
      designSystems: await context.designSystems.listDesignSystems(context.designSystemOwner),
    }),
  });
};
