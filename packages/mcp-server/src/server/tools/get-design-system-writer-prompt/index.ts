import { readMarkdownAsString } from "@onbrand/file";
import { registerScopedTool } from "../shared/register-scoped-tool";
import { type ToolRegistrationContext } from "../shared/types";
import { DESIGN_SYSTEM_WRITER_PROMPT } from "./prompt";

export const registerGetDesignSystemWriterPromptTool = (context: ToolRegistrationContext): void => {
  registerScopedTool({
    context,
    name: "get_design_system_writer_prompt",
    scope: "onbrand:write",
    config: {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
      inputSchema: {},
    },
    handler: () => DESIGN_SYSTEM_WRITER_PROMPT,
  });
};
