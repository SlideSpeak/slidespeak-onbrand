import { requireScope } from "../../../auth/context";
import { readMarkdownAsString } from "@onbrand/file";
import { toToolResult } from "../shared/result";
import { type ToolRegistrationContext } from "../shared/types";
import { DESIGN_SYSTEM_WRITER_PROMPT } from "./prompt";

export const registerGetDesignSystemWriterPromptTool = ({
  server,
  authContext,
}: ToolRegistrationContext): void => {
  server.registerTool(
    "get_design_system_writer_prompt",
    {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
      inputSchema: {},
    },
    async () => {
      requireScope(authContext, "onbrand:write");
      return toToolResult(DESIGN_SYSTEM_WRITER_PROMPT);
    },
  );
};
