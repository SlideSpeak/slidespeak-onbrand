import { z } from "zod";
import { UnknownDesignSystemError } from "@onbrand/core/design-system/application-service";
import { readMarkdownAsString } from "@onbrand/file";
import { registerScopedTool } from "../shared/register-scoped-tool";
import { type ToolRegistrationContext } from "../shared/types";

export const registerGetDesignSystemTool = (context: ToolRegistrationContext): void => {
  registerScopedTool({
    context,
    name: "get_design_system",
    scope: "onbrand:read",
    handledErrors: [UnknownDesignSystemError],
    config: {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
      inputSchema: {
        designSystemId: z.string().describe("Design System id."),
      },
    },
    handler: ({ designSystemId }) =>
      context.designSystems.getDesignSystem(context.designSystemOwner, designSystemId),
  });
};
