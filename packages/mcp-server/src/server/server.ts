import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Implementation } from "@modelcontextprotocol/sdk/types.js";
import { designSystemOwnerFromMcpAuth, type McpAuthContext } from "../auth/context";
import { type DesignSystemApplicationService } from "@onbrand/core/design-system/application-service";
import { registerGetDesignSystemTool } from "./tools/get-design-system";
import { registerGetDesignSystemWriterSkillTool } from "./tools/get-design-system-writer-skill";
import { registerGetOnbrandSkillTool } from "./tools/get-onbrand-skill";
import { registerListDesignSystemsTool } from "./tools/list-design-systems";
import { registerMaterializeBrandKitAssetsTool } from "./tools/materialize-brand-kit-assets";
import { registerPrepareDesignSystemAssetUploadsTool } from "./tools/prepare-design-system-asset-uploads";
import { registerWriteDesignSystemTool } from "./tools/write-design-system";

export { toToolResult } from "./tools/shared/result";

export const SERVER_INFO = {
  name: "onbrand",
  version: "0.1.0",
} satisfies Implementation;

export const createOnbrandMcpServer = (
  designSystems: DesignSystemApplicationService,
  authContext: McpAuthContext,
): McpServer => {
  const server = new McpServer(SERVER_INFO);
  const context = {
    server,
    designSystems,
    authContext,
    designSystemOwner: designSystemOwnerFromMcpAuth(authContext),
  };

  registerGetOnbrandSkillTool(context);
  registerListDesignSystemsTool(context);
  registerGetDesignSystemTool(context);
  registerMaterializeBrandKitAssetsTool(context);
  registerGetDesignSystemWriterSkillTool(context);
  registerPrepareDesignSystemAssetUploadsTool(context);
  registerWriteDesignSystemTool(context);

  return server;
};
