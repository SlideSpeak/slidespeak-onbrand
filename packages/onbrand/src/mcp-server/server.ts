import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type AuthContext, requireScope } from "../auth/context";
import { UnknownBrandKitAssetError } from "../design-system/brand-kit/asset";
import { type DesignSystemRegistry, UnknownDesignSystemError } from "../design-system/registry/registry";

export const SERVER_INFO = {
  name: "onbrand",
  version: "0.1.0",
} as const;

type ToolResult<T extends object> = {
  structuredContent: T;
  content: [{ type: "text"; text: string }];
};

type ToolErrorResult = {
  isError: true;
  content: [{ type: "text"; text: string }];
};

export const createOnbrandMcpServer = (
  registry: DesignSystemRegistry,
  authContext: AuthContext,
): McpServer => {
  const server = new McpServer(SERVER_INFO);

  server.registerTool(
    "list_design_systems",
    {
      description:
        "List available Design Systems. Use this first to choose the Design System before generating slides, presentations, decks, or other branded materials.",
      inputSchema: {},
    },
    async () => {
      requireScope(authContext, "onbrand:read");
      return toToolResult({ designSystems: await registry.listDesignSystems(authContext) });
    },
  );

  server.registerTool(
    "get_design_system",
    {
      description:
        "Get the Design System, including Brand Kit and Presentation Kit. Brand Kit visual assets include assetHandle, filename, and mimeType metadata. To use Logo or Decorative Asset files, call get_brand_kit_asset_files and write the returned base64 file contents into your workspace.",
      inputSchema: {
        designSystemId: z.string().describe("Design System id."),
      },
    },
    async ({ designSystemId }) => {
      try {
        requireScope(authContext, "onbrand:read");
        return toToolResult(await registry.getDesignSystem(authContext, designSystemId));
      } catch (error) {
        if (error instanceof UnknownDesignSystemError) {
          return toToolErrorResult(error);
        }
        throw error;
      }
    },
  );

  server.registerTool(
    "get_brand_kit_asset_files",
    {
      description:
        "Return exact file contents for declared Brand Kit visuals in a Design System. Use assetHandle values from get_design_system; omit assetHandles to fetch the Logo and all Decorative Assets in Brand Kit order. The caller must decode each contentBase64 value and write it to the returned filename in its own workspace before referencing it from generated artifacts.",
      inputSchema: {
        designSystemId: z.string().describe("Design System id."),
        assetHandles: z
          .array(z.string().min(1))
          .min(1)
          .optional()
          .describe(
            "Optional assetHandle values from get_design_system, such as 'LOGO' or 'DECORATIVE_ASSET_WAVE_DIVIDER'. Omit to fetch the Logo and all Decorative Assets.",
          ),
      },
    },
    async ({ designSystemId, assetHandles }) => {
      try {
        requireScope(authContext, "onbrand:read");
        return toToolResult(
          await registry.getBrandKitAssetFiles(authContext, { designSystemId, assetHandles }),
        );
      } catch (error) {
        if (error instanceof UnknownDesignSystemError || error instanceof UnknownBrandKitAssetError) {
          return toToolErrorResult(error);
        }
        throw error;
      }
    },
  );

  return server;
};

export const toToolResult = <T extends object>(result: T): ToolResult<T> => ({
  structuredContent: result,
  content: [{ type: "text", text: JSON.stringify(result) }],
});

const toToolErrorResult = (error: Error): ToolErrorResult => ({
  isError: true,
  content: [{ type: "text", text: error.message }],
});
