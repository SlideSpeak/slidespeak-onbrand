import { z } from "zod";
import { requireScope } from "../../../auth/context";
import { readMarkdownAsString } from "@onbrand/file";
import { toToolResult } from "../shared/result";
import { uploadDeclarationSchema } from "../shared/asset-schemas";
import { type ToolRegistrationContext } from "../shared/types";

export const registerPrepareDesignSystemAssetUploadsTool = ({
  server,
  registry,
  authContext,
}: ToolRegistrationContext): void => {
  server.registerTool(
    "prepare_design_system_asset_uploads",
    {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
      inputSchema: {
        designSystemId: z
          .string()
          .min(1)
          .regex(/^[a-z0-9][a-z0-9-]*$/),
        uploads: z.array(uploadDeclarationSchema).min(1),
      },
    },
    async (request) => {
      requireScope(authContext, "onbrand:write");
      return toToolResult(await registry.prepareDesignSystemAssetUploads(authContext, request));
    },
  );
};
