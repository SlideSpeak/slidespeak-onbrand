import { describe, expect, it } from "vitest";

import { dashboardMcpUrl, onboardingConnections } from "./runtime-config";

describe("dashboard runtime config", () => {
  it("derives the MCP URL from the current dashboard origin", () => {
    expect(dashboardMcpUrl({ origin: "https://onbrand.example" })).toBe(
      "https://onbrand.example/mcp",
    );
    expect(dashboardMcpUrl({ origin: "https://onbrand.example/" })).toBe(
      "https://onbrand.example/mcp",
    );
  });

  it("uses the local BASE_URL default when no browser location is available", () => {
    expect(dashboardMcpUrl(undefined)).toBe("http://localhost:8080/mcp");
  });

  it("builds onboarding commands from the derived MCP URL", () => {
    const connections = onboardingConnections("https://oauth-provider.example/mcp");

    expect(connections.map((connection) => connection.value)).toEqual([
      "codex mcp add onbrand --url https://oauth-provider.example/mcp",
      "claude mcp add --transport http onbrand https://oauth-provider.example/mcp",
      `{"mcpServers":{"onbrand":{"url":"https://oauth-provider.example/mcp"}}}`,
    ]);
  });
});
