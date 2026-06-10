import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  type DesignSystemRegistry,
  UnknownDesignSystemError,
} from "../design-system/registry/registry";

export const serverInfo = {
  name: "onbrand",
  version: "0.1.0",
} as const;

export const createOnbrandMcpServer = (registry: DesignSystemRegistry): McpServer => {
  const server = new McpServer(serverInfo);

  server.registerTool(
    "list_design_systems",
    {
      description: "List available Design Systems.",
      inputSchema: {},
    },
    async () => toToolResult({ designSystems: registry.listDesignSystems() }),
  );

  server.registerTool(
    "get_brand_kit",
    {
      description: "Get the Brand Kit for a Design System.",
      inputSchema: {
        designSystemId: z.string().describe("Design System id."),
      },
    },
    async ({ designSystemId }) => {
      try {
        return toToolResult(registry.getBrandKit(designSystemId));
      } catch (error) {
        if (error instanceof UnknownDesignSystemError) {
          return {
            isError: true,
            content: [{ type: "text" as const, text: error.message }],
          };
        }
        throw error;
      }
    },
  );

  return server;
};

export const toToolResult = <T extends object>(
  result: T,
): { structuredContent: T; content: [{ type: "text"; text: string }] } => ({
  structuredContent: result,
  content: [{ type: "text", text: JSON.stringify(result) }],
});
