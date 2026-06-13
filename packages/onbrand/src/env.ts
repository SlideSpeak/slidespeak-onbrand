import {
  createEnvRegistry,
  optionalString,
  requiredPositiveInteger,
  requiredString,
} from "@onbrand/env";

export const defaultDatabaseUrl =
  "postgresql://onbrand:onbrand@localhost:5433/onbrand?schema=public";
export const Env = createEnvRegistry({
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
