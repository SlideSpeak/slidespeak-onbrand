import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type AuthContext, requireScope } from "../auth/context";
import {
  type DesignSystemRegistry,
  type MaterializedBrandKitAsset,
  type MaterializedBrandKitAssets,
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

type MaterializedBrandKitAssetToolResult = MaterializedBrandKitAsset &
  Readonly<{ relativePath?: string }>;

type MaterializedBrandKitAssetsToolResult = Omit<MaterializedBrandKitAssets, "assets"> &
  Readonly<{ assets: readonly MaterializedBrandKitAssetToolResult[] }>;

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
        "Get the Design System, including Brand Kit and Presentation Kit. Brand Kit visual assets include assetHandle, filename, and mimeType metadata. To use Logo or Decorative Asset files, call materialize_brand_kit_assets and reference the returned local paths.",
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
        "Write exact local copies of declared Brand Kit visual files for a Design System. Use assetHandle values from get_design_system; omit assetHandles to copy the Logo and all Decorative Assets in Brand Kit order. Prefer an absolute outputDirectory inside the user's current project, or provide workspaceDirectory when using a relative outputDirectory in clients without MCP roots. Returns local file paths only and never returns SVG text or base64 image bytes.",
      inputSchema: {
        designSystemId: z.string().describe("Design System id."),
        outputDirectory: z
          .string()
          .min(1)
          .describe(
            "Local directory where asset copies should be written. Prefer an absolute path inside the user's current project. Relative paths resolve against workspaceDirectory when provided, then the MCP client workspace root when available, then the server current working directory.",
          ),
        workspaceDirectory: z
          .string()
          .min(1)
          .optional()
          .describe(
            "Optional path to the user's current project/workspace. Provide this when the MCP client does not expose roots, so relative outputDirectory values materialize in the intended project instead of the MCP server directory.",
          ),
        assetHandles: z
          .array(z.string().min(1))
          .min(1)
          .optional()
          .describe(
            "Optional assetHandle values from get_design_system, such as 'LOGO' or 'DECORATIVE_ASSET_WAVE_DIVIDER'. Omit to materialize the Logo and all Decorative Assets.",
          ),
        overwrite: z
          .boolean()
          .optional()
          .describe(
            "Whether to overwrite existing files with the same filenames. Defaults to true.",
          ),
      },
    },
    async ({ designSystemId, outputDirectory, workspaceDirectory, assetHandles, overwrite }) => {
      try {
        // Materializing copies assets into the caller's own workspace, not server state, so it
        // is a read operation today. Switch to "onbrand:write" if a server-side write is added.
        requireScope(authContext, "onbrand:read");
        const target = await resolveMaterializationTarget(
          server,
          outputDirectory,
          workspaceDirectory,
        );
        const result = await registry.materializeBrandKitAssets(authContext, {
          designSystemId,
          outputDirectory: target.outputDirectory,
          assetHandles,
          overwrite,
        });
        return toToolResult(withRelativePaths(result, target.relativeOutputDirectory));
      } catch (error) {
        if (error instanceof Error) {
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

type MaterializationTarget = Readonly<{
  outputDirectory: string;
  relativeOutputDirectory?: string;
}>;

const resolveMaterializationTarget = async (
  server: McpServer,
  outputDirectory: string,
  workspaceDirectory: string | undefined,
): Promise<MaterializationTarget> => {
  if (path.isAbsolute(outputDirectory)) {
    return { outputDirectory: path.resolve(outputDirectory) };
  }

  const roots = workspaceDirectory === undefined ? await clientFileRoots(server) : [];
  const baseDirectory =
    workspaceDirectory ?? roots[0] ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const resolved = path.resolve(baseDirectory, outputDirectory);

  return {
    outputDirectory: resolved,
    relativeOutputDirectory: normalizeRelativeOutputDirectory(outputDirectory),
  };
};

const clientFileRoots = async (server: McpServer): Promise<readonly string[]> => {
  try {
    const { roots } = await server.server.listRoots();
    return roots.flatMap((root) => filePathFromRootUri(root.uri));
  } catch {
    return [];
  }
};

const filePathFromRootUri = (uri: string): string[] => {
  try {
    const url = new URL(uri);
    return url.protocol === "file:" ? [fileURLToPath(url)] : [];
  } catch {
    return [];
  }
};

const normalizeRelativeOutputDirectory = (outputDirectory: string): string => {
  const normalized = outputDirectory.replace(/^\.\/+/, "").replace(/\/+$/, "");
  return normalized === "." ? "" : normalized;
};

const withRelativePaths = (
  result: MaterializedBrandKitAssets,
  relativeOutputDirectory: string | undefined,
): MaterializedBrandKitAssetsToolResult => ({
  ...result,
  assets:
    relativeOutputDirectory === undefined
      ? result.assets
      : result.assets.map((asset) => ({
          ...asset,
          relativePath:
            relativeOutputDirectory.length === 0
              ? asset.filename
              : path.posix.join(relativeOutputDirectory, asset.filename),
        })),
});
