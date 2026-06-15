import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type DesignSystemApplicationService } from "@onbrand/core/design-system/application-service";
import type { DesignSystemOwner } from "@onbrand/core/design-system/owner";
import { type McpAuthContext } from "../../../auth/context";

export type ToolRegistrationContext = {
  server: McpServer;
  designSystems: DesignSystemApplicationService;
  authContext: McpAuthContext;
  designSystemOwner: DesignSystemOwner;
};
