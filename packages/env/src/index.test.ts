import { afterEach, describe, expect, test } from "vitest";
import { createEnvRegistry, optionalString, requiredPositiveInteger, requiredString } from ".";

const defaultDatabaseUrl = "postgresql://test:test@localhost:5432/test";

const requiredTestEnv = {
  BASE_URL: "https://onbrand.example",
  SLIDESPEAK_OAUTH_ISSUER: "https://slidespeak.example",
  AWS_S3_BUCKET_BRAND_KIT_ASSETS: "brand-kit-assets",
  AWS_ACCESS_KEY_ID: "test-access-key",
  AWS_SECRET_ACCESS_KEY: "test-secret-key",
};

const Env = createEnvRegistry({
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

const originalAwsRegion = process.env.AWS_REGION;

afterEach(() => {
  if (originalAwsRegion === undefined) delete process.env.AWS_REGION;
  else process.env.AWS_REGION = originalAwsRegion;
});

describe("Env", () => {
  test("validates required variables while allowing declared defaults", () => {
    expect(() => Env.validate(requiredTestEnv)).not.toThrow();
    expect(() => Env.validate({})).toThrow(/BASE_URL/);
  });

  test("reads values from the same registry declaration", () => {
    process.env.AWS_REGION = "eu-west-1";

    expect(Env.AWS_REGION).toBe("eu-west-1");
  });

  test("reports missing required variables without throwing", () => {
    const report = Env.formatReport({});

    expect(report).toContain("BASE_URL");
    expect(report).toContain("DATABASE_URL");
    expect(report).toContain("DEFAULT");
  });

  test("validates positive integer variables", () => {
    expect(() =>
      Env.validate({
        ...requiredTestEnv,
        ASSET_DOWNLOAD_EXPIRES_IN_SECONDS: "0",
      }),
    ).toThrow(/ASSET_DOWNLOAD_EXPIRES_IN_SECONDS.*positive integer/);
  });
});
