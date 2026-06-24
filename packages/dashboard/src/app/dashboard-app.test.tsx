import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: Readonly<{
    children?: ReactNode;
    to: string;
    [key: string]: unknown;
  }>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => () => undefined,
  useRouterState: () => "/",
}));

import {
  DashboardRail,
  GeneratingBrandGuideView,
  HomeDashboard,
  HomeDashboardHeader,
} from "./dashboard-app";
import { BRAND_GUIDE_SECTION_LINKS } from "../brand-guide/navigation/brand-guide-sections";

describe("HomeDashboard", () => {
  it("renders URL-based creation without the sign-in CTA when the authenticated user has no Brand Guides", () => {
    const html = renderToStaticMarkup(<HomeDashboard brandGuides={[]} />);

    expect(html).toContain("First, let&#x27;s onboard your brand.");
    expect(html).toContain("Create");
    expect(html).not.toContain("Connect to the OnBrand MCP to start using your brand guide.");
    expect(html).not.toContain("Sign in to see your dashboard and brands");
    expect(html).not.toContain("/login?returnTo=/");
  });

  it("renders existing Brand Guides with only the title and create CTA above the grid", () => {
    const html = renderToStaticMarkup(<HomeDashboardHeader />);

    expect(html).toContain("Brand Guides");
    expect(html).toContain("Create Brand Guide");
    expect(html).not.toContain("First, let&#x27;s onboard your brand.");
    expect(html).not.toContain("https://slidespeak.co");
  });

  it("renders the Brand Guide section icons for the empty authenticated dashboard", () => {
    const html = renderToStaticMarkup(<DashboardRail inertPreview />);
    const visibleSectionLabels = BRAND_GUIDE_SECTION_LINKS.filter(
      ({ section }) => section !== "METADATA",
    ).map(({ label }) => label);

    expect(html).toContain('aria-label="Dashboard navigation"');
    expect(html).toContain('aria-label="MCP Connection"');
    expect(html).not.toContain('href="/mcp"');
    expect(html.indexOf('aria-label="MCP Connection"')).toBeLessThan(
      html.indexOf('aria-label="Details"'),
    );
    for (const label of visibleSectionLabels) {
      expect(html).toContain(`aria-label="${label}"`);
    }
  });

  it("renders the fake MCP rail item as selected in the empty authenticated dashboard", () => {
    const html = renderToStaticMarkup(
      <DashboardRail inertPreview selectedBrandGuideSection="MCP" />,
    );
    const mcpIndex = html.indexOf('aria-label="MCP Connection"');

    expect(mcpIndex).toBeGreaterThan(-1);
    expect(html).not.toContain('href="/mcp"');
    expect(html.slice(mcpIndex, mcpIndex + 260)).toContain('aria-current="page"');
  });

  it("renders the real MCP rail item as a Brand Guide section link", () => {
    const html = renderToStaticMarkup(<DashboardRail selectedBrandGuideId="acme" />);

    expect(html).toContain('aria-label="MCP Connection"');
    expect(html).toContain('href="/brand-guides/$brandGuideId/$section"');
    expect(html).not.toContain('href="/mcp"');
  });

  it("renders the screen-level Brand Guide generation state", () => {
    const html = renderToStaticMarkup(<GeneratingBrandGuideView />);

    expect(html).toContain('role="status"');
    expect(html).toContain("Generating Brand Guide");
    expect(html).not.toContain("First, let&#x27;s onboard your brand.");
    expect(html).not.toContain("Connect to the OnBrand MCP to start using your brand guide.");
  });
});
