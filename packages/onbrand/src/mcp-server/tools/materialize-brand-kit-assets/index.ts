import { z } from "zod";
import { requireScope } from "../../../auth/context";
import {
  UnknownBrandKitAssetError,
  UnmaterializedBrandKitAssetError,
} from "../../../design-system/brand-kit/asset";
import { UnknownDesignSystemError } from "../../../design-system/registry/registry";
import { readMarkdownAsString } from "@onbrand/file";
import { toToolErrorResult, toToolResult } from "../shared/result";
import { type ToolRegistrationContext } from "../shared/types";

export const registerMaterializeBrandKitAssetsTool = ({
  server,
  registry,
  authContext,
}: ToolRegistrationContext): void => {
  server.registerTool(
    "materialize_brand_kit_assets",
    {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
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
};
