import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Implementation } from "@modelcontextprotocol/sdk/types.js";
import { brandGuideOwnerFromMcpAuth, type McpAuthContext } from "../auth/context";
import { type BrandGuideApplicationService } from "@onbrand/core/brand-guide/application-service";
import { registerGetBrandGuideTool } from "./tools/get-brand-guide";
import { registerGetBrandGuideWriterSkillTool } from "./tools/get-brand-guide-writer-skill";
import { registerGetOnbrandSkillTool } from "./tools/get-onbrand-skill";
import { registerListBrandGuidesTool } from "./tools/list-brand-guides";
import { registerMaterializeBrandKitAssetsTool } from "./tools/materialize-brand-kit-assets";
import { registerPrepareBrandGuideAssetUploadsTool } from "./tools/prepare-brand-guide-asset-uploads";
import { registerWriteBrandGuideTool } from "./tools/write-brand-guide";

export { toToolResult } from "./tools/shared/result";

export const SERVER_INFO = {
  name: "onbrand",
  version: "0.1.0",
} satisfies Implementation;

export const createOnbrandMcpServer = (
  brandGuides: BrandGuideApplicationService,
  authContext: McpAuthContext,
): McpServer => {
  const server = new McpServer(SERVER_INFO);
  const context = {
    server,
    brandGuides,
    authContext,
    brandGuideOwner: brandGuideOwnerFromMcpAuth(authContext),
  };

  registerGetOnbrandSkillTool(context);
  registerListBrandGuidesTool(context);
  registerGetBrandGuideTool(context);
  registerMaterializeBrandKitAssetsTool(context);
  registerGetBrandGuideWriterSkillTool(context);
  registerPrepareBrandGuideAssetUploadsTool(context);
  registerWriteBrandGuideTool(context);

  return server;
};
