import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Implementation } from "@modelcontextprotocol/sdk/types.js";
import { type AuthContext } from "../auth/context";
import { type DesignSystemRegistry } from "../design-system/registry/registry";
import { registerGetDesignSystemTool } from "./tools/get-design-system";
import { registerGetDesignSystemWriterPromptTool } from "./tools/get-design-system-writer-prompt";
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
  registry: DesignSystemRegistry,
  authContext: AuthContext,
): McpServer => {
  const server = new McpServer(SERVER_INFO);
  const context = { server, registry, authContext };

  registerListDesignSystemsTool(context);
  registerGetDesignSystemTool(context);
  registerMaterializeBrandKitAssetsTool(context);
  registerGetDesignSystemWriterPromptTool(context);
  registerPrepareDesignSystemAssetUploadsTool(context);
  registerWriteDesignSystemTool(context);

  return server;
};
