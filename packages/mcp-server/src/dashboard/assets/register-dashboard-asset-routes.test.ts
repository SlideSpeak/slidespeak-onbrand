import { describe, expect, it } from "vitest";

import { DASHBOARD_SPA_PATHS, renderDashboardIndex } from "./register-dashboard-asset-routes";

describe("dashboard asset routes", () => {
  it("injects absolute public social URLs from BASE_URL", () => {
    const html = `
      <meta property="og:url" content="__ONBRAND_PUBLIC_URL__" />
      <meta property="og:image" content="__ONBRAND_PUBLIC_IMAGE_URL__" />
      <meta name="twitter:image" content="__ONBRAND_PUBLIC_IMAGE_URL__" />
    `;

    expect(renderDashboardIndex(html, "https://onbrand.example/app")).toContain(
      '<meta property="og:url" content="https://onbrand.example/" />',
    );
    expect(renderDashboardIndex(html, "https://onbrand.example/app")).toContain(
      '<meta property="og:image" content="https://onbrand.example/onbrand-banner.webp" />',
    );
    expect(renderDashboardIndex(html, "https://onbrand.example/app")).toContain(
      '<meta name="twitter:image" content="https://onbrand.example/onbrand-banner.webp" />',
    );
  });

  it("normalizes a BASE_URL with a trailing slash", () => {
    const html = "__ONBRAND_PUBLIC_URL__ __ONBRAND_PUBLIC_IMAGE_URL__";

    expect(renderDashboardIndex(html, "https://onbrand.example/")).toBe(
      "https://onbrand.example/ https://onbrand.example/onbrand-banner.webp",
    );
  });

  it("serves direct visits for dashboard routes", () => {
    expect(DASHBOARD_SPA_PATHS).toEqual(expect.arrayContaining(["/", "/brand-guides"]));
    expect(DASHBOARD_SPA_PATHS).not.toContain("/mcp");
    expect(DASHBOARD_SPA_PATHS).not.toContain("/brand-guide-generation-requests/:id");
    expect(DASHBOARD_SPA_PATHS).not.toContain("/home");
    expect(DASHBOARD_SPA_PATHS).not.toContain("/onboard");
  });
});
