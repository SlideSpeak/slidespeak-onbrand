import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardRail, HomeDashboard } from "./dashboard-app";
import { BRAND_GUIDE_SECTION_LINKS } from "../brand-guide/navigation/brand-guide-sections";

describe("HomeDashboard", () => {
  it("renders onboarding without the sign-in CTA when the authenticated user has no Brand Guides", () => {
    const html = renderToStaticMarkup(<HomeDashboard brandGuides={[]} />);

    expect(html).toContain("Connect to the OnBrand MCP");
    expect(html).toContain("Prompt your agent");
    expect(html).toContain("Generate brand guidelines based on: slidespeak.co");
    expect(html).not.toContain("Sign in to see your dashboard and brands");
    expect(html).not.toContain("/login?returnTo=/");
  });

  it("renders the Brand Guide section icons for the empty authenticated dashboard", () => {
    const html = renderToStaticMarkup(<DashboardRail inertPreview />);
    const visibleSectionLabels = BRAND_GUIDE_SECTION_LINKS.filter(
      ({ section }) => section !== "METADATA",
    ).map(({ label }) => label);

    expect(html).toContain('aria-label="Brand Guide sections"');
    for (const label of visibleSectionLabels) {
      expect(html).toContain(`aria-label="${label}"`);
    }
  });
});
