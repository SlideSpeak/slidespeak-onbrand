import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type AuthContext } from "../../../auth/context";
import { type DesignSystemRegistry } from "../../../design-system/registry/registry";

export type ToolRegistrationContext = {
  server: McpServer;
  registry: DesignSystemRegistry;
  authContext: AuthContext;
};
