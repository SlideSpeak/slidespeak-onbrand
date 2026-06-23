import { describe, expect, it } from "vitest";

import { buildOAuthRuntimeConfig, type OAuthRuntimeEnv } from "./runtime-config";

const env = {
  BASE_URL: "https://onbrand.example/",
  OAUTH_ISSUER: "https://oauth.example/",
  OAUTH_AUTHORIZATION_ENDPOINT: "https://oauth.example/authorize",
  OAUTH_TOKEN_ENDPOINT: "https://oauth.example/token",
  OAUTH_BACKCHANNEL_TOKEN_ENDPOINT: "http://oauth.internal/token",
  OAUTH_REGISTRATION_ENDPOINT: "https://oauth.example/register",
  OAUTH_JWKS_URL: "https://oauth.example/jwks.json",
  OAUTH_DASHBOARD_CLIENT_ID: "onbrand-dashboard",
  OAUTH_REQUIRED_READ_SCOPE: "custom:read",
  OAUTH_REQUIRED_WRITE_SCOPE: "custom:write",
  OAUTH_OWNER_ID_CLAIM: "account_user_id",
} satisfies OAuthRuntimeEnv;

describe("OAuth runtime config", () => {
  it("derives MCP and callback URLs from BASE_URL", () => {
    const config = buildOAuthRuntimeConfig(env);

    expect(config.baseUrl).toBe("https://onbrand.example");
    expect(config.mcpUrl.toString()).toBe("https://onbrand.example/mcp");
    expect(config.callbackUrl.toString()).toBe("https://onbrand.example/oauth/callback");
  });

  it("uses explicit OAuth endpoints and provider contract claims", () => {
    const config = buildOAuthRuntimeConfig(env);

    expect(config.issuer).toBe("https://oauth.example");
    expect(config.authorizationEndpoint).toBe(env.OAUTH_AUTHORIZATION_ENDPOINT);
    expect(config.tokenEndpoint).toBe(env.OAUTH_TOKEN_ENDPOINT);
    expect(config.backchannelTokenEndpoint).toBe(env.OAUTH_BACKCHANNEL_TOKEN_ENDPOINT);
    expect(config.registrationEndpoint).toBe(env.OAUTH_REGISTRATION_ENDPOINT);
    expect(config.jwksUrl).toBe(env.OAUTH_JWKS_URL);
    expect(config.dashboardClientId).toBe(env.OAUTH_DASHBOARD_CLIENT_ID);
    expect(config.supportedScopes).toEqual(["custom:read", "custom:write"]);
    expect(config.mcpRequiredScopes).toEqual(["custom:read"]);
    expect(config.dashboardRequiredScopes).toEqual(["custom:read", "custom:write"]);
    expect(config.ownerIdClaim).toBe("account_user_id");
  });

  it("omits blank optional dynamic registration endpoints", () => {
    expect(
      buildOAuthRuntimeConfig({ ...env, OAUTH_REGISTRATION_ENDPOINT: "" }).registrationEndpoint,
    ).toBeUndefined();
  });

  it("defaults the backchannel token endpoint to the public token endpoint", () => {
    const publicOnlyEnv = { ...env, OAUTH_BACKCHANNEL_TOKEN_ENDPOINT: undefined };

    expect(buildOAuthRuntimeConfig(publicOnlyEnv).backchannelTokenEndpoint).toBe(
      publicOnlyEnv.OAUTH_TOKEN_ENDPOINT,
    );
    expect(
      buildOAuthRuntimeConfig({
        ...env,
        OAUTH_BACKCHANNEL_TOKEN_ENDPOINT: "",
      }).backchannelTokenEndpoint,
    ).toBe(env.OAUTH_TOKEN_ENDPOINT);
  });
});
