import { requireScope } from "../../../auth/context";
import { readMarkdownAsString } from "@onbrand/file";
import { toToolResult } from "../shared/result";
import { type ToolRegistrationContext } from "../shared/types";

export const registerListDesignSystemsTool = ({
  server,
  registry,
  authContext,
}: ToolRegistrationContext): void => {
  server.registerTool(
    "list_design_systems",
    {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
      inputSchema: {},
    },
    async () => {
      requireScope(authContext, "onbrand:read");
      return toToolResult({ designSystems: await registry.listDesignSystems(authContext) });
    },
  );
};
