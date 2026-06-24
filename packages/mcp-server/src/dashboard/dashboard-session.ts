import { createHash } from "node:crypto";
import { InvalidTokenError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { Env } from "@onbrand/core/env";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { Context } from "hono";
import {
  ownerUserIdFromAuthInfo,
  type OAuthAccessTokenVerifier,
} from "../auth/oauth-token-verifier";
import { getCookie, setCookie } from "hono/cookie";
import { EncryptJWT, jwtDecrypt, jwtVerify, SignJWT, type JWTPayload } from "jose";

export type DashboardSession = Readonly<{
  ownerUserId: string;
  scopes: readonly string[];
  expiresAt: number;
}>;

export const DASHBOARD_SESSION_COOKIE = "onbrand_dashboard_session";
export const DASHBOARD_REFRESH_COOKIE = "onbrand_dashboard_refresh";

const DASHBOARD_REFRESH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const ENCODER = new TextEncoder();

const secretKey = (secret: string) => ENCODER.encode(secret);
const encryptionKey = (secret: string) => createHash("sha256").update(secret).digest();

export type DashboardSessionRefreshConfig = Readonly<{
  baseUrl: string;
  clientId: string;
  mcpUrl: URL;
  tokenEndpoint: string;
  verifier: OAuthAccessTokenVerifier;
  verifyBearerAuth: (
    authorizationHeader: string | undefined,
    verifier: OAuthAccessTokenVerifier,
  ) => Promise<AuthInfo>;
}>;

type DashboardRefreshFailureClassification =
  | "local_refresh_cookie_missing"
  | "local_refresh_cookie_expired"
  | "local_refresh_cookie_invalid"
  | "token_endpoint_network_error"
  | "token_endpoint_rejected"
  | "token_endpoint_invalid_grant"
  | "token_endpoint_malformed_response"
  | "token_endpoint_missing_access_token"
  | "token_endpoint_missing_refresh_token"
  | "refreshed_access_token_invalid";

export const dashboardSessionFromAuthInfo = (authInfo: AuthInfo): DashboardSession => {
  if (typeof authInfo.expiresAt !== "number") {
    throw new InvalidTokenError("Dashboard access token is missing expiration");
  }
  return {
    ownerUserId: ownerUserIdFromAuthInfo(authInfo),
    scopes: authInfo.scopes,
    expiresAt: authInfo.expiresAt,
  };
};

export const createDashboardSessionCookie = async (
  session: DashboardSession,
  secret: string,
): Promise<string> =>
  new SignJWT({ scopes: session.scopes })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.ownerUserId)
    .setExpirationTime(session.expiresAt)
    .setIssuedAt()
    .sign(secretKey(secret));

export const createDashboardRefreshCookie = async (
  refreshToken: string,
  secret: string,
  maxAgeSeconds = DASHBOARD_REFRESH_COOKIE_MAX_AGE_SECONDS,
): Promise<string> =>
  new EncryptJWT({ refreshToken })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .encrypt(encryptionKey(secret));

export const verifyDashboardRefreshCookie = async (
  cookie: string | undefined,
  secret: string,
): Promise<string> => {
  if (!cookie) throw new InvalidTokenError("Missing dashboard refresh token");

  let payload: JWTPayload;
  try {
    ({ payload } = await jwtDecrypt(cookie, encryptionKey(secret)));
  } catch (error) {
    throw new InvalidTokenError(
      error instanceof Error ? error.message : "Dashboard refresh token is invalid",
    );
  }

  if (typeof payload.refreshToken !== "string" || payload.refreshToken.length === 0) {
    throw new InvalidTokenError("Dashboard refresh token is missing");
  }
  return payload.refreshToken;
};

export const verifyDashboardSessionCookie = async (
  cookie: string | undefined,
  secret: string,
): Promise<DashboardSession> => {
  if (!cookie) throw new InvalidTokenError("Missing dashboard session");

  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(cookie, secretKey(secret)));
  } catch (error) {
    throw new InvalidTokenError(
      error instanceof Error ? error.message : "Dashboard session is invalid",
    );
  }

  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new InvalidTokenError("Dashboard session is missing subject");
  }
  if (typeof payload.exp !== "number") {
    throw new InvalidTokenError("Dashboard session is missing expiration");
  }
  const scopes = Array.isArray(payload.scopes)
    ? payload.scopes.filter((scope): scope is string => typeof scope === "string")
    : [];

  return { ownerUserId: payload.sub, scopes, expiresAt: payload.exp };
};

export const getDashboardSession = async (
  context: Context,
  refreshConfig?: DashboardSessionRefreshConfig,
): Promise<DashboardSession> => {
  try {
    return await verifyDashboardSessionCookie(
      getCookie(context, DASHBOARD_SESSION_COOKIE),
      Env.DASHBOARD_SESSION_SECRET,
    );
  } catch (error) {
    if (!refreshConfig) throw error;
    return refreshDashboardSession(context, refreshConfig);
  }
};

const refreshDashboardSession = async (
  context: Context,
  {
    baseUrl,
    clientId,
    mcpUrl,
    tokenEndpoint,
    verifier,
    verifyBearerAuth,
  }: DashboardSessionRefreshConfig,
): Promise<DashboardSession> => {
  const refreshCookie = getCookie(context, DASHBOARD_REFRESH_COOKIE);
  let refreshToken: string;
  try {
    refreshToken = await verifyDashboardRefreshCookie(refreshCookie, Env.DASHBOARD_SESSION_SECRET);
  } catch (error) {
    const classification: DashboardRefreshFailureClassification = refreshCookie
      ? localRefreshCookieFailureClassification(error)
      : "local_refresh_cookie_missing";
    logDashboardRefreshFailure(classification, { clearsCookies: true });
    clearDashboardAuthCookies(context, classification);
    throw error;
  }

  logDashboardRefreshEvent("attempt", { tokenEndpoint });

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        resource: mcpUrl.toString(),
      }),
    });
  } catch (error) {
    logDashboardRefreshFailure("token_endpoint_network_error", {
      clearsCookies: false,
      message: errorMessage(error),
    });
    throw new InvalidTokenError("Dashboard session refresh temporarily unavailable");
  }

  if (!tokenResponse.ok) {
    const bodyText = await tokenResponse.text();
    const oauthError = parseOAuthError(bodyText);
    const classification: DashboardRefreshFailureClassification =
      oauthError === "invalid_grant" ? "token_endpoint_invalid_grant" : "token_endpoint_rejected";
    logDashboardRefreshFailure(classification, {
      clearsCookies: false,
      status: tokenResponse.status,
      oauthError,
    });
    throw new InvalidTokenError(
      bodyText || `Dashboard session refresh rejected with ${tokenResponse.status}`,
    );
  }

  let tokenJson: {
    access_token?: unknown;
    refresh_token?: unknown;
  };
  try {
    tokenJson = (await tokenResponse.json()) as typeof tokenJson;
  } catch (error) {
    logDashboardRefreshFailure("token_endpoint_malformed_response", {
      clearsCookies: false,
      message: errorMessage(error),
    });
    throw new InvalidTokenError("Refresh response is not valid JSON");
  }
  if (typeof tokenJson.access_token !== "string") {
    logDashboardRefreshFailure("token_endpoint_missing_access_token", { clearsCookies: false });
    throw new InvalidTokenError("Refresh response is missing access token");
  }
  if (typeof tokenJson.refresh_token !== "string") {
    logDashboardRefreshFailure("token_endpoint_missing_refresh_token", { clearsCookies: false });
    throw new InvalidTokenError("Refresh response is missing refresh token");
  }

  let authInfo: AuthInfo;
  try {
    authInfo = await verifyBearerAuth(`Bearer ${tokenJson.access_token}`, verifier);
  } catch (error) {
    logDashboardRefreshFailure("refreshed_access_token_invalid", {
      clearsCookies: false,
      message: errorMessage(error),
    });
    throw error;
  }
  const session = dashboardSessionFromAuthInfo(authInfo);
  await setDashboardAuthCookies(context, baseUrl, session, tokenJson.refresh_token);
  logDashboardRefreshEvent("success", {
    ownerUserId: session.ownerUserId,
    expiresAt: session.expiresAt,
  });
  return session;
};

export const setDashboardAuthCookies = async (
  context: Context,
  baseUrl: string,
  session: DashboardSession,
  refreshToken: string,
): Promise<void> => {
  setCookie(
    context,
    DASHBOARD_SESSION_COOKIE,
    await createDashboardSessionCookie(session, Env.DASHBOARD_SESSION_SECRET),
    {
      httpOnly: true,
      secure: secureCookie(baseUrl),
      sameSite: "Lax",
      path: "/",
      maxAge: Math.max(0, Math.floor(session.expiresAt - Date.now() / 1000)),
    },
  );
  setCookie(
    context,
    DASHBOARD_REFRESH_COOKIE,
    await createDashboardRefreshCookie(refreshToken, Env.DASHBOARD_SESSION_SECRET),
    {
      httpOnly: true,
      secure: secureCookie(baseUrl),
      sameSite: "Lax",
      path: "/",
      maxAge: DASHBOARD_REFRESH_COOKIE_MAX_AGE_SECONDS,
    },
  );
};

export const clearDashboardAuthCookies = (
  context: Context,
  reason: DashboardRefreshFailureClassification | "explicit_clear" = "explicit_clear",
): void => {
  setCookie(context, DASHBOARD_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  setCookie(context, DASHBOARD_REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  logDashboardRefreshEvent("cookies_cleared", { reason });
};

const secureCookie = (baseUrl: string): boolean => new URL(baseUrl).protocol === "https:";

const parseOAuthError = (bodyText: string): string | undefined => {
  try {
    const body = JSON.parse(bodyText) as { error?: unknown };
    return typeof body.error === "string" ? body.error : undefined;
  } catch {
    return undefined;
  }
};

const localRefreshCookieFailureClassification = (
  error: unknown,
): DashboardRefreshFailureClassification =>
  error instanceof Error && /expired|exp.*claim/i.test(error.message)
    ? "local_refresh_cookie_expired"
    : "local_refresh_cookie_invalid";

const logDashboardRefreshFailure = (
  classification: DashboardRefreshFailureClassification,
  details: Readonly<Record<string, unknown>>,
): void => {
  logDashboardRefreshEvent("failure", { classification, ...details });
};

const logDashboardRefreshEvent = (
  event: "attempt" | "success" | "failure" | "cookies_cleared",
  details: Readonly<Record<string, unknown>>,
): void => {
  console.error(JSON.stringify({ event: `dashboard_session_refresh.${event}`, ...details }));
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
