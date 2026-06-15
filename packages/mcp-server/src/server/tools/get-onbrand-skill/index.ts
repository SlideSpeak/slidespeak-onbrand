import { readMarkdownAsString } from "@onbrand/file";
import { registerScopedTextTool } from "../shared/register-scoped-tool";
import { type ToolRegistrationContext } from "../shared/types";

const ONBRAND_SKILL = readMarkdownAsString(import.meta.url, "SKILL.mdx");

export const registerGetOnbrandSkillTool = (context: ToolRegistrationContext): void => {
  registerScopedTextTool({
    context,
    name: "get_onbrand_skill",
    scope: "onbrand:read",
    config: {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
      inputSchema: {},
    },
    handler: () => ({
      structuredContent: { skill: ONBRAND_SKILL },
      text: ONBRAND_SKILL,
    }),
  });
};
