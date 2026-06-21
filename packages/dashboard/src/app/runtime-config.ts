const DEFAULT_BASE_URL = "http://localhost:8080";

export type DashboardRuntimeLocation = Readonly<{
  origin: string;
}>;

export type OnboardingConnection = Readonly<{
  name: string;
  icon: "claude" | "codex" | "cursor";
  value: string;
}>;

const dashboardBaseUrl = (
  location: DashboardRuntimeLocation | undefined = globalLocation(),
): string => (location?.origin ? stripTrailingSlashes(location.origin) : DEFAULT_BASE_URL);

export const dashboardMcpUrl = (
  location: DashboardRuntimeLocation | undefined = globalLocation(),
): string => new URL("/mcp", dashboardBaseUrl(location)).toString();

export const onboardingConnections = (
  mcpUrl = dashboardMcpUrl(),
): readonly OnboardingConnection[] =>
  [
    {
      name: "Codex",
      icon: "codex",
      value: `codex mcp add onbrand --url ${mcpUrl}`,
    },
    {
      name: "Claude Code",
      icon: "claude",
      value: `claude mcp add --transport http onbrand ${mcpUrl}`,
    },
    {
      name: "Cursor",
      icon: "cursor",
      value: `{
  "mcpServers": {
    "onbrand": {
      "url": "${mcpUrl}"
    }
  }
}`,
    },
  ] as const;

const globalLocation = (): DashboardRuntimeLocation | undefined =>
  typeof window === "undefined" ? undefined : window.location;

const stripTrailingSlashes = (value: string): string => value.replace(/\/+$/, "");
