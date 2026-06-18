import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type BrandGuideApplicationService } from "@onbrand/core/brand-guide/application-service";
import type { BrandGuideOwner } from "@onbrand/core/brand-guide/owner";
import { type McpAuthContext } from "../../../auth/context";

export type ToolRegistrationContext = {
  server: McpServer;
  brandGuides: BrandGuideApplicationService;
  authContext: McpAuthContext;
  brandGuideOwner: BrandGuideOwner;
};
