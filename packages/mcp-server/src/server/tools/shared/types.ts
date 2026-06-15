import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type AuthContext } from "@onbrand/core/auth/context";
import { type DesignSystemApplicationService } from "@onbrand/core/design-system/application-service";

export type ToolRegistrationContext = {
  server: McpServer;
  designSystems: DesignSystemApplicationService;
  authContext: AuthContext;
};
