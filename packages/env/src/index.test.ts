import { describe, expect, test } from "vitest";
import { createEnvRegistry, optionalString, requiredPositiveInteger, requiredString } from ".";

const defaultDatabaseUrl = "postgresql://test:test@localhost:5432/test";

const requiredTestEnv = {
  BASE_URL: "https://onbrand.example",
  SLIDESPEAK_OAUTH_ISSUER: "https://slidespeak.example",
  AWS_S3_BUCKET_BRAND_KIT_ASSETS: "brand-kit-assets",
  AWS_ACCESS_KEY_ID: "test-access-key",
  AWS_SECRET_ACCESS_KEY: "test-secret-key",
};

const testRegistry = createEnvRegistry({
  BASE_URL: requiredString("BASE_URL"),
  SLIDESPEAK_OAUTH_ISSUER: requiredString("SLIDESPEAK_OAUTH_ISSUER"),
  SLIDESPEAK_JWKS_URL: optionalString("SLIDESPEAK_JWKS_URL"),
  ASSET_DOWNLOAD_EXPIRES_IN_SECONDS: requiredPositiveInteger(
    "ASSET_DOWNLOAD_EXPIRES_IN_SECONDS",
    900,
  ),
  AWS_S3_BUCKET_BRAND_KIT_ASSETS: requiredString("AWS_S3_BUCKET_BRAND_KIT_ASSETS"),
  DATABASE_URL: requiredString("DATABASE_URL", defaultDatabaseUrl),
  AWS_REGION: requiredString("AWS_REGION", "us-east-1"),
  AWS_ACCESS_KEY_ID: requiredString("AWS_ACCESS_KEY_ID"),
  AWS_SECRET_ACCESS_KEY: requiredString("AWS_SECRET_ACCESS_KEY"),
});

describe("Env", () => {
  test("validates registry-specific required and defaulted variables", () => {
    expect(() => testRegistry.validate(requiredTestEnv)).not.toThrow();
    expect(() => testRegistry.validate({})).toThrow(
      "Missing required environment variable: BASE_URL",
    );
  });

  test("reads values from the same registry declaration", () => {
    const original = process.env.AWS_REGION;
    process.env.AWS_REGION = "eu-west-1";
    expect(testRegistry.AWS_REGION).toBe("eu-west-1");
    if (original === undefined) delete process.env.AWS_REGION;
    else process.env.AWS_REGION = original;
  });

  test("reports missing required variables without throwing", () => {
    const report = testRegistry.formatReport({});

    expect(report).toContain("MISSING=5");
    expect(report).toMatch(/\| BASE_URL\s+\| REQUIRED \| MISSING \| MISSING\s+\|/);
    expect(report).toMatch(/\| DATABASE_URL\s+\| REQUIRED \| DEFAULT \| DEFAULT\(\*{8}\)\s+\|/);
  });

  test("validates positive integer variables", () => {
    expect(() =>
      testRegistry.validate({
        ...requiredTestEnv,
        ASSET_DOWNLOAD_EXPIRES_IN_SECONDS: "0",
      }),
    ).toThrow("ASSET_DOWNLOAD_EXPIRES_IN_SECONDS must be a positive integer");
  });
});
