import { Env } from "@onbrand/core/env";

export type OAuthRuntimeConfig = Readonly<{
  baseUrl: string;
  mcpUrl: URL;
  callbackUrl: URL;
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  backchannelTokenEndpoint: string;
  registrationEndpoint?: string;
  jwksUrl: string;
  dashboardClientId: string;
  supportedScopes: readonly [string, string];
  mcpRequiredScopes: readonly [string];
  dashboardRequiredScopes: readonly [string, string];
  ownerIdClaim: string;
}>;

export type OAuthRuntimeEnv = Readonly<{
  BASE_URL: string;
  OAUTH_ISSUER: string;
  OAUTH_AUTHORIZATION_ENDPOINT: string;
  OAUTH_TOKEN_ENDPOINT: string;
  OAUTH_BACKCHANNEL_TOKEN_ENDPOINT?: string;
  OAUTH_REGISTRATION_ENDPOINT?: string;
  OAUTH_JWKS_URL: string;
  OAUTH_DASHBOARD_CLIENT_ID: string;
  OAUTH_REQUIRED_READ_SCOPE: string;
  OAUTH_REQUIRED_WRITE_SCOPE: string;
  OAUTH_OWNER_ID_CLAIM: string;
}>;

export const buildOAuthRuntimeConfig = (env: OAuthRuntimeEnv = Env): OAuthRuntimeConfig => {
  const baseUrl = stripTrailingSlashes(env.BASE_URL);
  const supportedScopes = [env.OAUTH_REQUIRED_READ_SCOPE, env.OAUTH_REQUIRED_WRITE_SCOPE] as const;
  return {
    baseUrl,
    mcpUrl: new URL("/mcp", baseUrl),
    callbackUrl: new URL("/oauth/callback", baseUrl),
    issuer: stripTrailingSlashes(env.OAUTH_ISSUER),
    authorizationEndpoint: env.OAUTH_AUTHORIZATION_ENDPOINT,
    tokenEndpoint: env.OAUTH_TOKEN_ENDPOINT,
    backchannelTokenEndpoint:
      emptyToUndefined(env.OAUTH_BACKCHANNEL_TOKEN_ENDPOINT) ?? env.OAUTH_TOKEN_ENDPOINT,
    registrationEndpoint: emptyToUndefined(env.OAUTH_REGISTRATION_ENDPOINT),
    jwksUrl: env.OAUTH_JWKS_URL,
    dashboardClientId: env.OAUTH_DASHBOARD_CLIENT_ID,
    supportedScopes,
    mcpRequiredScopes: [env.OAUTH_REQUIRED_READ_SCOPE],
    dashboardRequiredScopes: supportedScopes,
    ownerIdClaim: env.OAUTH_OWNER_ID_CLAIM,
  };
};

const stripTrailingSlashes = (value: string): string => value.replace(/\/+$/, "");

const emptyToUndefined = (value: string | undefined): string | undefined =>
  value === undefined || value === "" ? undefined : value;
