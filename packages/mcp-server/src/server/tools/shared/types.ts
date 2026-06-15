import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type McpAuthContext } from "../../../auth/context";
import { type DesignSystemApplicationService } from "@onbrand/core/design-system/application-service";

export type ToolRegistrationContext = {
  server: McpServer;
  designSystems: DesignSystemApplicationService;
  authContext: McpAuthContext;
};
