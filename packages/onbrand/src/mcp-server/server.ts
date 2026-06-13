import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type AuthContext, requireScope } from "../auth/context";
import {
  UnknownBrandKitAssetError,
  UnmaterializedBrandKitAssetError,
} from "../design-system/brand-kit/asset";
import {
  type DesignSystemRegistry,
  UnknownDesignSystemError,
} from "../design-system/registry/registry";

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
        "Get the Design System, including Brand Kit and Presentation Kit. Brand Kit visual assets include assetHandle, filename, and mimeType metadata. To use Logo or Decorative Asset files, call materialize_brand_kit_assets, then run the returned shell commands to download exact files into your workspace.",
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
    "materialize_brand_kit_assets",
    {
      description:
        "Prepare exact local copies of declared Brand Kit visual files for a Design System. Returns short-lived S3 download URLs plus shell commands; run those commands in the user's workspace to download assets to outputDirectory before referencing them from generated artifacts. Never copy asset bytes through the chat transcript.",
      inputSchema: {
        designSystemId: z.string().describe("Design System id."),
        outputDirectory: z
          .string()
          .min(1)
          .default("assets")
          .describe(
            "Directory where the client should download asset files. Use a relative path such as 'assets' so generated HTML can reference returned relativePath values.",
          ),
        assetHandles: z
          .array(z.string().min(1))
          .min(1)
          .optional()
          .describe(
            "Optional assetHandle values from get_design_system, such as 'LOGO' or 'DECORATIVE_ASSET_WAVE_DIVIDER'. Omit to materialize the Logo and all Decorative Assets.",
          ),
      },
    },
    async ({ designSystemId, outputDirectory, assetHandles }) => {
      try {
        requireScope(authContext, "onbrand:read");
        return toToolResult(
          await registry.materializeBrandKitAssets(authContext, {
            designSystemId,
            outputDirectory,
            assetHandles,
          }),
        );
      } catch (error) {
        if (
          error instanceof UnknownDesignSystemError ||
          error instanceof UnknownBrandKitAssetError ||
          error instanceof UnmaterializedBrandKitAssetError
        ) {
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
