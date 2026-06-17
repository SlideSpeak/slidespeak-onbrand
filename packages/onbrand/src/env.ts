import {
  createEnvRegistry,
  optionalString,
  requiredPositiveInteger,
  requiredString,
} from "@onbrand/env";

export const DEFAULT_DATABASE_URL =
  "postgresql://onbrand:onbrand@localhost:5433/onbrand?schema=public";
export const Env = createEnvRegistry({
  BASE_URL: requiredString("BASE_URL"),
  SLIDESPEAK_OAUTH_ISSUER: requiredString("SLIDESPEAK_OAUTH_ISSUER"),
  SLIDESPEAK_OAUTH_BACKCHANNEL_BASE_URL: optionalString("SLIDESPEAK_OAUTH_BACKCHANNEL_BASE_URL"),
  SLIDESPEAK_JWKS_URL: optionalString("SLIDESPEAK_JWKS_URL"),
  DASHBOARD_OAUTH_CLIENT_ID: requiredString("DASHBOARD_OAUTH_CLIENT_ID", "onbrand-dashboard"),
  DASHBOARD_SESSION_SECRET: requiredString(
    "DASHBOARD_SESSION_SECRET",
    "dev-onbrand-dashboard-session-secret",
  ),
  DASHBOARD_DEV_SERVER_URL: optionalString("DASHBOARD_DEV_SERVER_URL"),
  ASSET_DOWNLOAD_EXPIRES_IN_SECONDS: requiredPositiveInteger(
    "ASSET_DOWNLOAD_EXPIRES_IN_SECONDS",
    900,
  ),
  AWS_S3_BUCKET_BRAND_KIT_ASSETS: requiredString("AWS_S3_BUCKET_BRAND_KIT_ASSETS"),
  DATABASE_URL: requiredString("DATABASE_URL", DEFAULT_DATABASE_URL),
  AWS_REGION: requiredString("AWS_REGION", "us-east-1"),
  AWS_ACCESS_KEY_ID: requiredString("AWS_ACCESS_KEY_ID"),
  AWS_SECRET_ACCESS_KEY: requiredString("AWS_SECRET_ACCESS_KEY"),
});
