import { readMarkdownAsString } from "@onbrand/file";
import { registerScopedTextTool } from "../shared/register-scoped-tool";
import { type ToolRegistrationContext } from "../shared/types";

const BRAND_GUIDE_WRITER_SKILL = readMarkdownAsString(import.meta.url, "SKILL.mdx");

export const registerGetBrandGuideWriterSkillTool = (context: ToolRegistrationContext): void => {
  registerScopedTextTool({
    context,
    name: "get_brand_guide_writer_skill",
    scope: "onbrand:write",
    config: {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
      inputSchema: {},
    },
    handler: () => ({
      structuredContent: { writerSkill: BRAND_GUIDE_WRITER_SKILL },
      text: BRAND_GUIDE_WRITER_SKILL,
    }),
  });
};
