import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HomeDashboard } from "./dashboard-app";

describe("HomeDashboard", () => {
  it("renders onboarding without the sign-in CTA when the authenticated user has no Brand Guides", () => {
    const html = renderToStaticMarkup(<HomeDashboard brandGuides={[]} />);

    expect(html).toContain("Connect to the OnBrand MCP");
    expect(html).toContain("Prompt your agent");
    expect(html).toContain("Generate brand guidelines based on: slidespeak.co");
    expect(html).not.toContain("Sign in to see your dashboard and brands");
    expect(html).not.toContain("/login?returnTo=/");
  });
});
