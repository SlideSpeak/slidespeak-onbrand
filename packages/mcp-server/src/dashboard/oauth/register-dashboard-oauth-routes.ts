import { createHash, randomBytes } from "node:crypto";
import { Env } from "@onbrand/core/env";
import type { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { SlideSpeakTokenVerifier } from "../../auth/slidespeak-token-verifier";
import { dashboardSessionFromAuthInfo, setDashboardAuthCookies } from "../dashboard-session";

const OAUTH_STATE_COOKIE = "onbrand_oauth_state";
const OAUTH_VERIFIER_COOKIE = "onbrand_oauth_verifier";
const OAUTH_RETURN_TO_COOKIE = "onbrand_oauth_return_to";
const DEFAULT_DASHBOARD_RETURN_TO = "/";

export type DashboardOAuthRoutesConfig = Readonly<{
  app: Hono;
  authorizationEndpoint: string;
  baseUrl: string;
  mcpUrl: URL;
  requiredScopes: readonly string[];
  tokenEndpoint: string;
  verifier: SlideSpeakTokenVerifier;
  verifyBearerAuth: (
    authorizationHeader: string | undefined,
    verifier: SlideSpeakTokenVerifier,
  ) => Promise<Awaited<ReturnType<SlideSpeakTokenVerifier["verifyAccessToken"]>>>;
}>;

export const registerDashboardOAuthRoutes = ({
  app,
  authorizationEndpoint,
  baseUrl,
  mcpUrl,
  requiredScopes,
  tokenEndpoint,
  verifier,
  verifyBearerAuth,
}: DashboardOAuthRoutesConfig): void => {
  app.get("/login", (context) => {
    const state = randomBytes(24).toString("base64url");
    const codeVerifier = randomBytes(32).toString("base64url");
    const redirectUri = new URL("/oauth/callback", baseUrl).toString();
    const authorizeUrl = new URL(authorizationEndpoint);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", Env.DASHBOARD_OAUTH_CLIENT_ID);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("resource", mcpUrl.toString());
    authorizeUrl.searchParams.set("scope", requiredScopes.join(" "));
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("code_challenge", codeChallengeForVerifier(codeVerifier));
    authorizeUrl.searchParams.set("code_challenge_method", "S256");

    const cookieOptions = {
      httpOnly: true,
      secure: secureCookie(baseUrl),
      sameSite: "Lax" as const,
      path: "/",
      maxAge: 5 * 60,
    };
    setCookie(context, OAUTH_STATE_COOKIE, state, cookieOptions);
    setCookie(context, OAUTH_VERIFIER_COOKIE, codeVerifier, cookieOptions);
    setCookie(
      context,
      OAUTH_RETURN_TO_COOKIE,
      safeDashboardReturnTo(context.req.query("returnTo")),
      cookieOptions,
    );
    return context.redirect(authorizeUrl.toString());
  });

  app.get("/oauth/callback", async (context) => {
    const code = context.req.query("code");
    const state = context.req.query("state");
    const expectedState = getCookie(context, OAUTH_STATE_COOKIE);
    const codeVerifier = getCookie(context, OAUTH_VERIFIER_COOKIE);
    if (!code || !state || state !== expectedState || !codeVerifier) {
      return context.text("Invalid OAuth callback", 400);
    }

    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: new URL("/oauth/callback", baseUrl).toString(),
      code_verifier: codeVerifier,
      client_id: Env.DASHBOARD_OAUTH_CLIENT_ID,
      resource: mcpUrl.toString(),
    });
    const tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody,
    });
    if (!tokenResponse.ok) return context.text(await tokenResponse.text(), 502);
    const tokenJson = (await tokenResponse.json()) as {
      access_token?: unknown;
      refresh_token?: unknown;
    };
    if (typeof tokenJson.access_token !== "string")
      return context.text("Missing access token", 502);
    if (typeof tokenJson.refresh_token !== "string")
      return context.text("Missing refresh token", 502);

    const authInfo = await verifyBearerAuth(`Bearer ${tokenJson.access_token}`, verifier);
    await setDashboardAuthCookies(
      context,
      baseUrl,
      dashboardSessionFromAuthInfo(authInfo),
      tokenJson.refresh_token,
    );
    const returnTo = safeDashboardReturnTo(getCookie(context, OAUTH_RETURN_TO_COOKIE));
    setCookie(context, OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
    setCookie(context, OAUTH_VERIFIER_COOKIE, "", { path: "/", maxAge: 0 });
    setCookie(context, OAUTH_RETURN_TO_COOKIE, "", { path: "/", maxAge: 0 });
    return context.redirect(returnTo);
  });
};

const codeChallengeForVerifier = (verifier: string): string =>
  createHash("sha256").update(verifier).digest("base64url");

const safeDashboardReturnTo = (returnTo: string | undefined): string => {
  if (!returnTo) return DEFAULT_DASHBOARD_RETURN_TO;
  if (returnTo === "/" || returnTo === "/onboard" || returnTo === "/brand-guides" || returnTo.startsWith("/brand-guides/")) return returnTo;
  return DEFAULT_DASHBOARD_RETURN_TO;
};

const secureCookie = (baseUrl: string): boolean => new URL(baseUrl).protocol === "https:";
