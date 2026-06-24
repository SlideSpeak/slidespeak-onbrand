import { describe, expect, it } from "vitest";

import { routeFromPathname } from "./route";

describe("routeFromPathname", () => {
  it("recognizes the MCP connection Brand Guide section", () => {
    expect(routeFromPathname("/brand-guides/acme/mcp")).toMatchObject({
      selectedBrandGuideId: "acme",
      selectedBrandGuideSection: "MCP",
    });
  });

  it("recognizes Brand Guide detail routes", () => {
    expect(routeFromPathname("/brand-guides/acme/logo")).toMatchObject({
      selectedBrandGuideId: "acme",
      selectedBrandGuideSection: "LOGO",
    });
  });
});
