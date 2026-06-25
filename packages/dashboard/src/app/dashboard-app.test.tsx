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
  DashboardShell,
  GeneratingBrandGuideView,
  HomeDashboardHeader,
  HomeTopBar,
  McpConnectionPage,
  OnboardingDashboardSurface,
} from "./dashboard-app";
import { BRAND_GUIDE_SECTION_LINKS } from "../brand-guide/navigation/brand-guide-sections";

describe("HomeDashboard", () => {
  it("uses one dashboard shell geometry for public and authenticated dashboard surfaces", () => {
    const html = renderToStaticMarkup(
      <DashboardShell rail={<DashboardRail />} topBar={<div data-testid="topbar" />}>
        <p>Dashboard content</p>
      </DashboardShell>,
    );

    expect(html).toContain('class="min-h-screen bg-onbrand-canvas text-onbrand-charcoal"');
    expect(html).toContain(
      'class="flex min-h-screen overflow-hidden border border-onbrand-charcoal/10 bg-onbrand-panel shadow-[0_32px_120px_rgba(10,10,10,0.16)]"',
    );
    expect(html).toContain('class="min-w-0 flex-1 bg-onbrand-white"');
    expect(html).toContain(
      'class="min-w-0 px-4 py-4 sm:px-6 lg:h-[calc(100vh-4rem)] lg:px-7 lg:py-5 overflow-y-auto"',
    );
  });

  it("keeps preview and real rails on identical logo and divider geometry", () => {
    const previewHtml = renderToStaticMarkup(<DashboardRail inertPreview />);
    const realHtml = renderToStaticMarkup(<DashboardRail selectedBrandGuideId="acme" />);

    expect(previewHtml).toContain(
      'class="hidden w-16 shrink-0 flex-col items-center border-r border-onbrand-charcoal/8 bg-onbrand-panel px-2 py-5 text-onbrand-charcoal lg:flex"',
    );
    expect(realHtml).toContain(
      'class="hidden w-16 shrink-0 flex-col items-center border-r border-onbrand-charcoal/8 bg-onbrand-panel px-2 py-5 text-onbrand-charcoal lg:flex"',
    );
    expect(previewHtml).toContain(
      'class="mb-6 grid h-9 w-9 place-items-center rounded-md transition hover:bg-onbrand-charcoal/5"',
    );
    expect(realHtml).toContain(
      'class="mb-6 grid h-9 w-9 place-items-center rounded-md transition hover:bg-onbrand-charcoal/5"',
    );
    expect(previewHtml).toContain('class="onbrand-dashboard-logo h-6 w-6"');
    expect(realHtml).toContain('class="onbrand-dashboard-logo h-6 w-6"');
  });

  it("renders URL-based creation without the sign-in CTA when the authenticated user has no Brand Guides", () => {
    const html = renderToStaticMarkup(
      <OnboardingDashboardSurface theme="light" topBar={() => <div />} />,
    );

    expect(html).toContain("First, let&#x27;s onboard your brand.");
    expect(html).toContain("Create");
    expect(html).toContain("Or");
    expect(html).toContain("Connect to MCP");
    expect(html).not.toContain("Connect to the OnBrand MCP to start using your brand guide.");
    expect(html).not.toContain("Sign in to see your dashboard and brands");
    expect(html).not.toContain("/login?returnTo=/");
  });

  it("renders the dark onboarding MCP CTA as charcoal with white text and border", () => {
    const html = renderToStaticMarkup(
      <OnboardingDashboardSurface theme="dark" topBar={() => <div />} />,
    );
    const mcpCtaIndex = html.indexOf("Connect to MCP");

    expect(mcpCtaIndex).toBeGreaterThan(-1);
    expect(html.slice(mcpCtaIndex - 420, mcpCtaIndex)).toContain(
      "border-white bg-[#111111] px-4 text-sm font-medium text-white",
    );
  });

  it("renders the MCP connection screen with all supported client commands", () => {
    const html = renderToStaticMarkup(<McpConnectionPage />);

    expect(html).toContain("Connect to the OnBrand MCP to start using your brand guide.");
    expect(html).toContain('aria-label="Codex"');
    expect(html).toContain('aria-label="Claude Code"');
    expect(html).toContain('aria-label="Cursor"');
    expect(html).toContain("codex mcp add onbrand --url http://localhost:8080/mcp");
  });

  it("renders existing Brand Guides with only the title and create CTA above the grid", () => {
    const html = renderToStaticMarkup(<HomeDashboardHeader />);

    expect(html).toContain("Brand Guides");
    expect(html).toContain("Create Brand Guide");
    expect(html).not.toContain("First, let&#x27;s onboard your brand.");
    expect(html).not.toContain("https://slidespeak.co");
  });

  it("renders the theme switcher in the authenticated home top bar", () => {
    const html = renderToStaticMarkup(<HomeTopBar onThemeChange={() => undefined} theme="dark" />);

    expect(html).toContain("Welcome to OnBrand by SlideSpeak");
    expect(html).toContain('aria-label="Light mode"');
    expect(html).toContain('aria-label="Dark mode"');
  });

  it("lets the Source URL field accept bare brand domains", () => {
    const html = renderToStaticMarkup(
      <OnboardingDashboardSurface theme="light" topBar={() => <div />} />,
    );

    expect(html).toContain('type="text"');
    expect(html).toContain('inputMode="url"');
    expect(html).toContain('placeholder="slidespeak.co"');
    expect(html).not.toContain('type="url"');
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
