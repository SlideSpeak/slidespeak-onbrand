import { serve } from "@hono/node-server";
import { S3 } from "@onbrand/s3";
import { Hono } from "hono";
import type { Context } from "hono";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { getOAuthProtectedResourceMetadataUrl } from "@modelcontextprotocol/sdk/server/auth/router.js";
import {
  InsufficientScopeError,
  InvalidTokenError,
  OAuthError,
  ServerError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { createPrismaClient } from "@onbrand/core/database/prisma-client";
import { PersistentBrandGuideApplication } from "@onbrand/core/brand-guide/application";
import { OAuthAccessTokenVerifier, ownerUserIdFromAuthInfo } from "../auth/oauth-token-verifier";
import { Env } from "@onbrand/core/env";
import { registerDashboardApiRoutes } from "../dashboard/api/register-dashboard-api-routes";
import { registerDashboardAssetRoutes } from "../dashboard/assets/register-dashboard-asset-routes";
import { registerDashboardOAuthRoutes } from "../dashboard/oauth/register-dashboard-oauth-routes";
import { buildOAuthRuntimeConfig } from "./runtime-config";
import { createOnbrandMcpServer } from "./server";

const HTTP_PORT = 8080;

type OAuthMetadata = Readonly<{
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  jwks_uri: string;
  response_types_supported: string[];
  grant_types_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  code_challenge_methods_supported: string[];
  scopes_supported: string[];
}>;

type VerifiedBearerAuth = Awaited<ReturnType<OAuthAccessTokenVerifier["verifyAccessToken"]>>;

const buildWwwAuthenticateHeader = (
  errorCode: string,
  message: string,
  resourceMetadataUrl: string,
  requiredScopes: readonly string[],
): string =>
  `Bearer error="${errorCode}", error_description="${message}", scope="${requiredScopes.join(
    " ",
  )}", resource_metadata="${resourceMetadataUrl}"`;

const verifyBearerAuth = async (
  authorizationHeader: string | undefined,
  verifier: OAuthAccessTokenVerifier,
): Promise<VerifiedBearerAuth> => {
  if (!authorizationHeader) throw new InvalidTokenError("Missing Authorization header");

  const [type, token] = authorizationHeader.split(" ");
  if (type.toLowerCase() !== "bearer" || !token) {
    throw new InvalidTokenError("Invalid Authorization header format, expected 'Bearer TOKEN'");
  }

  const authInfo = await verifier.verifyAccessToken(token);
  if (typeof authInfo.expiresAt !== "number" || Number.isNaN(authInfo.expiresAt)) {
    throw new InvalidTokenError("Token has no expiration time");
  }
  if (authInfo.expiresAt < Date.now() / 1000) {
    throw new InvalidTokenError("Token has expired");
  }

  return authInfo;
};

const handleOAuthError = (
  context: Context,
  error: unknown,
  protectedResourceMetadataUrl: string,
  requiredScopes: readonly string[],
): Response => {
  if (error instanceof InvalidTokenError) {
    context.header(
      "WWW-Authenticate",
      buildWwwAuthenticateHeader(
        error.errorCode,
        error.message,
        protectedResourceMetadataUrl,
        requiredScopes,
      ),
    );
    return context.json(error.toResponseObject(), 401);
  }
  if (error instanceof InsufficientScopeError) {
    context.header(
      "WWW-Authenticate",
      buildWwwAuthenticateHeader(
        error.errorCode,
        error.message,
        protectedResourceMetadataUrl,
        requiredScopes,
      ),
    );
    return context.json(error.toResponseObject(), 403);
  }
  if (error instanceof ServerError) return context.json(error.toResponseObject(), 500);
  if (error instanceof OAuthError) return context.json(error.toResponseObject(), 400);
  const serverError = new ServerError("Internal Server Error");
  return context.json(serverError.toResponseObject(), 500);
};

const main = async (): Promise<void> => {
  console.error(Env.formatReport());
  Env.validate();

  const port = HTTP_PORT;
  const runtimeConfig = buildOAuthRuntimeConfig();
  const assetDownloadExpiresInSeconds = Env.ASSET_DOWNLOAD_EXPIRES_IN_SECONDS;

  const oauthMetadata: OAuthMetadata = {
    issuer: runtimeConfig.issuer,
    authorization_endpoint: runtimeConfig.authorizationEndpoint,
    token_endpoint: runtimeConfig.tokenEndpoint,
    ...(runtimeConfig.registrationEndpoint
      ? { registration_endpoint: runtimeConfig.registrationEndpoint }
      : {}),
    jwks_uri: runtimeConfig.jwksUrl,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: [...runtimeConfig.requiredScopes],
  };
  const protectedResourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(runtimeConfig.mcpUrl);
  const protectedResourceMetadata = {
    resource: runtimeConfig.mcpUrl.href,
    authorization_servers: [runtimeConfig.issuer],
    scopes_supported: [...runtimeConfig.requiredScopes],
    resource_name: "OnBrand MCP",
  };

  const prisma = createPrismaClient();
  const brandGuides = new PersistentBrandGuideApplication(
    prisma,
    S3,
    Env.AWS_S3_BUCKET_BRAND_KIT_ASSETS,
    assetDownloadExpiresInSeconds,
  );
  const verifier = new OAuthAccessTokenVerifier({
    issuer: runtimeConfig.issuer,
    audience: runtimeConfig.mcpUrl.toString(),
    jwksUrl: runtimeConfig.jwksUrl,
    requiredScopes: runtimeConfig.requiredScopes,
    ownerIdClaim: runtimeConfig.ownerIdClaim,
  });
  const app = new Hono();

  app.get("/health", (context) => context.json({ ok: true }));
  app.get("/.well-known/oauth-protected-resource/mcp", (context) =>
    context.json(protectedResourceMetadata),
  );
  app.get("/.well-known/oauth-authorization-server", (context) => context.json(oauthMetadata));

  registerDashboardOAuthRoutes({
    app,
    authorizationEndpoint: runtimeConfig.authorizationEndpoint,
    baseUrl: runtimeConfig.baseUrl,
    callbackUrl: runtimeConfig.callbackUrl,
    dashboardClientId: runtimeConfig.dashboardClientId,
    mcpUrl: runtimeConfig.mcpUrl,
    requiredScopes: runtimeConfig.requiredScopes,
    tokenEndpoint: runtimeConfig.tokenEndpoint,
    verifier,
    verifyBearerAuth,
  });
  registerDashboardApiRoutes({
    app,
    brandGuides,
    handleAuthError: (context, error) =>
      handleOAuthError(context, error, protectedResourceMetadataUrl, runtimeConfig.requiredScopes),
    refreshConfig: {
      baseUrl: runtimeConfig.baseUrl,
      clientId: runtimeConfig.dashboardClientId,
      mcpUrl: runtimeConfig.mcpUrl,
      tokenEndpoint: runtimeConfig.tokenEndpoint,
      verifier,
      verifyBearerAuth,
    },
  });
  registerDashboardAssetRoutes(app);

  app.on(["GET", "POST"], "/mcp", async (context) => {
    try {
      const authInfo = await verifyBearerAuth(context.req.header("authorization"), verifier);
      const ownerUserId = ownerUserIdFromAuthInfo(authInfo);
      const server = createOnbrandMcpServer(brandGuides, {
        ownerUserId,
        scopes: authInfo.scopes,
      });
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await server.connect(transport);
      return await transport.handleRequest(context.req.raw, { authInfo });
    } catch (error) {
      return handleOAuthError(
        context,
        error,
        protectedResourceMetadataUrl,
        runtimeConfig.requiredScopes,
      );
    }
  });

  app.delete("/mcp", async (context) => {
    try {
      await verifyBearerAuth(context.req.header("authorization"), verifier);
      return context.body(null, 200);
    } catch (error) {
      return handleOAuthError(
        context,
        error,
        protectedResourceMetadataUrl,
        runtimeConfig.requiredScopes,
      );
    }
  });

  serve({ fetch: app.fetch, port }, () => {
    console.error(`OnBrand remote MCP listening on ${runtimeConfig.mcpUrl.toString()}`);
  });
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exit(1);
});
