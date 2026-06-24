import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

import {
  createDashboardRefreshCookie,
  createDashboardSessionCookie,
  DASHBOARD_REFRESH_COOKIE,
  DASHBOARD_SESSION_COOKIE,
  getDashboardSession,
  verifyDashboardRefreshCookie,
  type DashboardSessionRefreshConfig,
} from "./dashboard-session";

const SECRET = "test-dashboard-session-secret";
const BASE_URL = "https://onbrand.example";
const MCP_URL = new URL("https://onbrand.example/mcp");
const TOKEN_ENDPOINT = "https://oauth.example/token";

const originalDashboardSessionSecret = process.env.DASHBOARD_SESSION_SECRET;

beforeEach(() => {
  process.env.DASHBOARD_SESSION_SECRET = SECRET;
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  if (originalDashboardSessionSecret === undefined) delete process.env.DASHBOARD_SESSION_SECRET;
  else process.env.DASHBOARD_SESSION_SECRET = originalDashboardSessionSecret;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("dashboard refresh cookie", () => {
  it("encrypts refresh tokens instead of storing them as readable cookie payload", async () => {
    const refreshToken = "slidespeak-refresh-token-secret";

    const cookie = await createDashboardRefreshCookie(refreshToken, SECRET);

    expect(cookie).not.toContain(refreshToken);
    await expect(verifyDashboardRefreshCookie(cookie, SECRET)).resolves.toBe(refreshToken);
  });
});

describe("dashboard session refresh", () => {
  it("sets new dashboard cookies after a successful refresh", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            access_token: "fresh-access-token",
            refresh_token: "fresh-refresh-token",
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await requestDashboardSession({
      sessionCookie: await expiredSessionCookie(),
      refreshCookie: await createDashboardRefreshCookie("old-refresh-token", SECRET),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ownerUserId: "owner-123",
      scopes: ["onbrand:read", "onbrand:write"],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      TOKEN_ENDPOINT,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
    );

    const setCookies = setCookieHeaders(response);
    expect(
      setCookies.find((header) => header.startsWith(`${DASHBOARD_SESSION_COOKIE}=`)),
    ).not.toContain("Max-Age=0");
    const refreshHeader = setCookies.find((header) =>
      header.startsWith(`${DASHBOARD_REFRESH_COOKIE}=`),
    );
    expect(refreshHeader).toBeDefined();
    expect(refreshHeader).not.toContain("Max-Age=0");
    await expect(
      verifyDashboardRefreshCookie(cookieValue(refreshHeader, DASHBOARD_REFRESH_COOKIE), SECRET),
    ).resolves.toBe("fresh-refresh-token");
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"event":"dashboard_session_refresh.attempt"'),
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"event":"dashboard_session_refresh.success"'),
    );
  });

  it("does not clear cookies when invalid_grant could be a provider refresh race", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "invalid_grant" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    const response = await requestDashboardSession({
      sessionCookie: await expiredSessionCookie(),
      refreshCookie: await createDashboardRefreshCookie("old-refresh-token", SECRET),
    });

    expect(response.status).toBe(401);
    expect(setCookieHeaders(response)).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"classification":"token_endpoint_invalid_grant"'),
    );
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('"clearsCookies":false'));
  });

  it("does not clear cookies when the token endpoint returns malformed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("not json", {
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    const response = await requestDashboardSession({
      sessionCookie: await expiredSessionCookie(),
      refreshCookie: await createDashboardRefreshCookie("old-refresh-token", SECRET),
    });

    expect(response.status).toBe(401);
    expect(setCookieHeaders(response)).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"classification":"token_endpoint_malformed_response"'),
    );
  });

  it("does not clear cookies when a successful token response omits the rotated refresh token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ access_token: "fresh-access-token" }), {
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    const response = await requestDashboardSession({
      sessionCookie: await expiredSessionCookie(),
      refreshCookie: await createDashboardRefreshCookie("old-refresh-token", SECRET),
    });

    expect(response.status).toBe(401);
    expect(setCookieHeaders(response)).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"classification":"token_endpoint_missing_refresh_token"'),
    );
  });

  it("clears cookies when the local refresh cookie is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await requestDashboardSession({
      sessionCookie: await expiredSessionCookie(),
    });

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expectClearedDashboardCookies(response);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"classification":"local_refresh_cookie_missing"'),
    );
  });

  it("clears cookies when the local refresh cookie is expired", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await requestDashboardSession({
      sessionCookie: await expiredSessionCookie(),
      refreshCookie: await createDashboardRefreshCookie("old-refresh-token", SECRET, -60),
    });

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expectClearedDashboardCookies(response);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"classification":"local_refresh_cookie_expired"'),
    );
  });
});

const expiredSessionCookie = (): Promise<string> =>
  createDashboardSessionCookie(
    {
      ownerUserId: "owner-123",
      scopes: ["onbrand:read", "onbrand:write"],
      expiresAt: Math.floor(Date.now() / 1000) - 60,
    },
    SECRET,
  );

const requestDashboardSession = async ({
  sessionCookie,
  refreshCookie,
}: Readonly<{
  sessionCookie?: string;
  refreshCookie?: string;
}>): Promise<Response> => {
  const app = new Hono();
  app.get("/api/test", async (context) => {
    try {
      return context.json(await getDashboardSession(context, refreshConfig()));
    } catch (error) {
      return context.text(error instanceof Error ? error.message : String(error), 401);
    }
  });
  return app.request("/api/test", {
    headers: { Cookie: cookieHeader({ sessionCookie, refreshCookie }) },
  });
};

const refreshConfig = (): DashboardSessionRefreshConfig => ({
  baseUrl: BASE_URL,
  clientId: "onbrand-dashboard",
  mcpUrl: MCP_URL,
  tokenEndpoint: TOKEN_ENDPOINT,
  verifier: {} as DashboardSessionRefreshConfig["verifier"],
  verifyBearerAuth: vi.fn(async () => ({
    token: "fresh-access-token",
    clientId: "onbrand-dashboard",
    scopes: ["onbrand:read", "onbrand:write"],
    expiresAt: Math.floor(Date.now() / 1000) + 900,
    resource: MCP_URL,
    extra: { ownerUserId: "owner-123" },
  })),
});

const cookieHeader = ({
  sessionCookie,
  refreshCookie,
}: Readonly<{
  sessionCookie?: string;
  refreshCookie?: string;
}>): string =>
  [
    sessionCookie ? `${DASHBOARD_SESSION_COOKIE}=${sessionCookie}` : undefined,
    refreshCookie ? `${DASHBOARD_REFRESH_COOKIE}=${refreshCookie}` : undefined,
  ]
    .filter((value): value is string => value !== undefined)
    .join("; ");

const setCookieHeaders = (response: Response): string[] => {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  return (
    headers.getSetCookie?.() ?? response.headers.get("set-cookie")?.split(/,(?=\s*[^;,]+=)/) ?? []
  );
};

const cookieValue = (header: string | undefined, name: string): string => {
  const value = header?.match(new RegExp(`^${name}=([^;]+)`))?.[1];
  if (!value) throw new Error(`Missing ${name} Set-Cookie header`);
  return value;
};

const expectClearedDashboardCookies = (response: Response): void => {
  const setCookies = setCookieHeaders(response);
  expect(setCookies).toEqual(
    expect.arrayContaining([
      expect.stringMatching(new RegExp(`^${DASHBOARD_SESSION_COOKIE}=;.*Max-Age=0`, "i")),
      expect.stringMatching(new RegExp(`^${DASHBOARD_REFRESH_COOKIE}=;.*Max-Age=0`, "i")),
    ]),
  );
};
