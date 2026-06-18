import { z } from "zod";
import { readMarkdownAsString } from "@onbrand/file";
import { registerScopedTool } from "../shared/register-scoped-tool";
import { uploadDeclarationSchema } from "../shared/asset-schemas";
import { type ToolRegistrationContext } from "../shared/types";

export const registerPrepareBrandGuideAssetUploadsTool = (
  context: ToolRegistrationContext,
): void => {
  registerScopedTool({
    context,
    name: "prepare_brand_guide_asset_uploads",
    scope: "onbrand:write",
    config: {
      description: readMarkdownAsString(import.meta.url, "description.mdx"),
      inputSchema: {
        brandGuideId: z
          .string()
          .min(1)
          .regex(/^[a-z0-9][a-z0-9-]*$/),
        uploads: z.array(uploadDeclarationSchema).min(1),
      },
    },
    handler: (request) =>
      context.brandGuides.prepareBrandGuideAssetUploads(context.brandGuideOwner, request),
  });
};
