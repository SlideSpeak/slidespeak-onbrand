import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  type DesignSystemRegistry,
  UnknownDesignSystemError,
} from "../design-system/registry/registry";

export const SERVER_INFO = {
  name: "onbrand",
  version: "0.1.0",
} as const;

export const createOnbrandMcpServer = (registry: DesignSystemRegistry): McpServer => {
  const server = new McpServer(SERVER_INFO);

  server.registerTool(
    "list_design_systems",
    {
      description:
        "Use when the user wants to create presentations/slides/decks. Pull all the design systems and pick the most suitable one for the request of the user. Then, generate the presentation via HTML/CSS",
      inputSchema: {},
    },
    async () => toToolResult({ designSystems: registry.listDesignSystems() }),
  );

  server.registerTool(
    "get_design_system",
    {
      description:
        "Get the Design System, including Brand Kit asset source paths that client agents should copy locally beside generated HTML before rendering; do not synthesize replacement assets. Also returns the Presentation Kit.",
      inputSchema: {
        designSystemId: z.string().describe("Design System id."),
      },
    },
    async ({ designSystemId }) => {
      try {
        return toToolResult(registry.getDesignSystem(designSystemId));
      } catch (error) {
        if (error instanceof UnknownDesignSystemError) {
          return toErrorToolResult(error.message);
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

const toErrorToolResult = (
  message: string,
): { isError: true; content: [{ type: "text"; text: string }] } => ({
  isError: true,
  content: [{ type: "text", text: message }],
});
