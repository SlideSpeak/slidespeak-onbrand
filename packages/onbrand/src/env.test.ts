import { describe, expect, it } from "vitest";

import { Env } from "./env";

const validEnv = {
  OAUTH_ISSUER: "https://oauth.example",
  OAUTH_AUTHORIZATION_ENDPOINT: "https://oauth.example/authorize",
  OAUTH_TOKEN_ENDPOINT: "https://oauth.example/token",
  OAUTH_JWKS_URL: "https://oauth.example/jwks.json",
  OAUTH_DASHBOARD_CLIENT_ID: "onbrand-dashboard",
  DASHBOARD_SESSION_SECRET: "test-dashboard-session-secret",
  AWS_S3_BUCKET_BRAND_KIT_ASSETS: "onbrand-brand-kit-assets",
  AWS_ACCESS_KEY_ID: "test-access-key",
  AWS_SECRET_ACCESS_KEY: "test-secret-key",
};

describe("OnBrand environment", () => {
  it("accepts the generic OAuth provider contract with documented defaults", () => {
    expect(() => Env.validate(validEnv)).not.toThrow();

    const report = Env.formatReport(validEnv);

    expect(report).toContain("BASE_URL");
    expect(report).toContain("OAUTH_REQUIRED_READ_SCOPE");
    expect(report).toContain("OAUTH_REQUIRED_WRITE_SCOPE");
    expect(report).toContain("OAUTH_OWNER_ID_CLAIM");
    expect(report).toContain("DEFAULT");
  });

  it.each([
    "OAUTH_ISSUER",
    "OAUTH_AUTHORIZATION_ENDPOINT",
    "OAUTH_TOKEN_ENDPOINT",
    "OAUTH_JWKS_URL",
    "OAUTH_DASHBOARD_CLIENT_ID",
  ])("requires %s explicitly", (name) => {
    expect(() => Env.validate({ ...validEnv, [name]: "" })).toThrow(
      new RegExp(`Missing required environment variable: ${name}`),
    );
  });

  it("does not accept legacy SlideSpeak OAuth aliases", () => {
    expect(() =>
      Env.validate({
        ...validEnv,
        OAUTH_ISSUER: "",
        SLIDESPEAK_OAUTH_ISSUER: "https://oauth.example",
        SLIDESPEAK_JWKS_URL: "https://oauth.example/jwks.json",
        DASHBOARD_OAUTH_CLIENT_ID: "legacy-dashboard",
      }),
    ).toThrow(/OAUTH_ISSUER/);
  });
});
