import {
  createEnvRegistry,
  optionalString,
  requiredPositiveInteger,
  requiredString,
} from "@onbrand/env";

export const DEFAULT_DATABASE_URL =
  "postgresql://onbrand:onbrand@localhost:5433/onbrand?schema=public";
export const Env = createEnvRegistry({
  BASE_URL: requiredString("BASE_URL", "http://localhost:8080"),
  OAUTH_ISSUER: requiredString("OAUTH_ISSUER"),
  OAUTH_AUTHORIZATION_ENDPOINT: requiredString("OAUTH_AUTHORIZATION_ENDPOINT"),
  OAUTH_TOKEN_ENDPOINT: requiredString("OAUTH_TOKEN_ENDPOINT"),
  OAUTH_REGISTRATION_ENDPOINT: optionalString("OAUTH_REGISTRATION_ENDPOINT"),
  OAUTH_JWKS_URL: requiredString("OAUTH_JWKS_URL"),
  OAUTH_DASHBOARD_CLIENT_ID: requiredString("OAUTH_DASHBOARD_CLIENT_ID"),
  OAUTH_REQUIRED_READ_SCOPE: requiredString("OAUTH_REQUIRED_READ_SCOPE", "onbrand:read"),
  OAUTH_REQUIRED_WRITE_SCOPE: requiredString("OAUTH_REQUIRED_WRITE_SCOPE", "onbrand:write"),
  OAUTH_OWNER_ID_CLAIM: requiredString("OAUTH_OWNER_ID_CLAIM", "sub"),
  DASHBOARD_SESSION_SECRET: requiredString("DASHBOARD_SESSION_SECRET"),
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
