import { readMarkdownAsString } from "@onbrand/file";
import { registerScopedTextTool } from "../shared/register-scoped-tool";
import { type ToolRegistrationContext } from "../shared/types";

const DESIGN_SYSTEM_WRITER_SKILL = readMarkdownAsString(import.meta.url, "SKILL.mdx");

export const registerGetDesignSystemWriterSkillTool = (context: ToolRegistrationContext): void => {
  registerScopedTextTool({
    context,
    name: "get_design_system_writer_skill",
    scope: "onbrand:write",
    config: {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
      inputSchema: {},
    },
    handler: () => ({
      structuredContent: { writerSkill: DESIGN_SYSTEM_WRITER_SKILL },
      text: DESIGN_SYSTEM_WRITER_SKILL,
    }),
  });
};
