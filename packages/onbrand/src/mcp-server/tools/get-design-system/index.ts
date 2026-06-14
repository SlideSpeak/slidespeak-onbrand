import { z } from "zod";
import { requireScope } from "../../../auth/context";
import { UnknownDesignSystemError } from "../../../design-system/registry/registry";
import { readMarkdownAsString } from "@onbrand/file";
import { toToolErrorResult, toToolResult } from "../shared/result";
import { type ToolRegistrationContext } from "../shared/types";

export const registerGetDesignSystemTool = ({
  server,
  registry,
  authContext,
}: ToolRegistrationContext): void => {
  server.registerTool(
    "get_design_system",
    {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
      inputSchema: {
        designSystemId: z.string().describe("Design System id."),
      },
    },
    async ({ designSystemId }) => {
      try {
        requireScope(authContext, "onbrand:read");
        return toToolResult(await registry.getDesignSystem(authContext, designSystemId));
      } catch (error) {
        if (error instanceof UnknownDesignSystemError) {
          return toToolErrorResult(error);
        }
        throw error;
      }
    },
  );
};
