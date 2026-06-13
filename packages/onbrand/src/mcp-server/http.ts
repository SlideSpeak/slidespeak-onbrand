import { serve } from "@hono/node-server";
import { S3 } from "@onbrand/s3";
import { Hono } from "hono";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { getOAuthProtectedResourceMetadataUrl } from "@modelcontextprotocol/sdk/server/auth/router.js";
import {
  InsufficientScopeError,
  InvalidTokenError,
  OAuthError,
  ServerError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { createPrismaClient } from "../database/prisma-client";
import { StorageBuckets } from "../storage/buckets";
import { PrismaDesignSystemRegistry } from "../design-system/registry/prisma-registry";
import {
  ownerUserIdFromAuthInfo,
  SlideSpeakTokenVerifier,
} from "../auth/slidespeak-token-verifier";
import { createOnbrandMcpServer } from "./server";

const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const positiveIntegerEnv = (name: string, defaultValue: number): number => {
  const rawValue = process.env[name];
  if (rawValue === undefined) return defaultValue;
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
};

const HTTP_PORT = 8080;
const REQUIRED_SCOPES = ["onbrand:read"];

type OAuthMetadata = Readonly<{
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint: string;
  jwks_uri: string;
  response_types_supported: string[];
  grant_types_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  code_challenge_methods_supported: string[];
  scopes_supported: string[];
}>;

const buildWwwAuthenticateHeader = (
  errorCode: string,
  message: string,
  resourceMetadataUrl: string,
): string =>
  `Bearer error="${errorCode}", error_description="${message}", scope="${REQUIRED_SCOPES.join(
    " ",
  )}", resource_metadata="${resourceMetadataUrl}"`;

const main = async (): Promise<void> => {
  const port = HTTP_PORT;
  const baseUrl = requiredEnv("BASE_URL").replace(/\/+$/, "");
  const mcpUrl = new URL("/mcp", baseUrl);
  const issuer = requiredEnv("SLIDESPEAK_OAUTH_ISSUER").replace(/\/+$/, "");
  const jwksUrl = process.env.SLIDESPEAK_JWKS_URL ?? `${issuer}/oauth/jwks.json`;
  const authorizationEndpoint = `${issuer}/oauth/authorize`;
  const tokenEndpoint = `${issuer}/oauth/token`;
  const registrationEndpoint = `${issuer}/oauth/register`;
  const assetDownloadExpiresInSeconds = positiveIntegerEnv(
    "ASSET_DOWNLOAD_EXPIRES_IN_SECONDS",
    900,
  );

  const oauthMetadata: OAuthMetadata = {
    issuer,
    authorization_endpoint: authorizationEndpoint,
    token_endpoint: tokenEndpoint,
    registration_endpoint: registrationEndpoint,
    jwks_uri: jwksUrl,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: ["onbrand:read", "onbrand:write"],
  };
  const protectedResourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(mcpUrl);
  const protectedResourceMetadata = {
    resource: mcpUrl.href,
    authorization_servers: [issuer],
    scopes_supported: ["onbrand:read", "onbrand:write"],
    resource_name: "SlideSpeak OnBrand MCP",
  };

  const prisma = createPrismaClient();
  const registry = new PrismaDesignSystemRegistry(
    prisma,
    S3,
    StorageBuckets.brandKitAssets,
    assetDownloadExpiresInSeconds,
  );
  const verifier = new SlideSpeakTokenVerifier({ issuer, audience: mcpUrl.toString(), jwksUrl });
  const app = new Hono();

  app.get("/health", (context) => context.json({ ok: true }));
  app.get("/.well-known/oauth-protected-resource/mcp", (context) =>
    context.json(protectedResourceMetadata),
  );
  app.get("/.well-known/oauth-authorization-server", (context) => context.json(oauthMetadata));

  app.on(["GET", "POST"], "/mcp", async (context) => {
    try {
      const authHeader = context.req.header("authorization");
      if (!authHeader) throw new InvalidTokenError("Missing Authorization header");

      const [type, token] = authHeader.split(" ");
      if (type.toLowerCase() !== "bearer" || !token) {
        throw new InvalidTokenError("Invalid Authorization header format, expected 'Bearer TOKEN'");
      }

      const authInfo = await verifier.verifyAccessToken(token);
      if (!REQUIRED_SCOPES.every((scope) => authInfo.scopes.includes(scope))) {
        throw new InsufficientScopeError("Insufficient scope");
      }
      if (typeof authInfo.expiresAt !== "number" || Number.isNaN(authInfo.expiresAt)) {
        throw new InvalidTokenError("Token has no expiration time");
      }
      if (authInfo.expiresAt < Date.now() / 1000) {
        throw new InvalidTokenError("Token has expired");
      }

      const ownerUserId = ownerUserIdFromAuthInfo(authInfo);
      const server = createOnbrandMcpServer(registry, {
        ownerUserId,
        scopes: authInfo.scopes,
      });
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await server.connect(transport);
      return await transport.handleRequest(context.req.raw, { authInfo });
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        context.header(
          "WWW-Authenticate",
          buildWwwAuthenticateHeader(error.errorCode, error.message, protectedResourceMetadataUrl),
        );
        return context.json(error.toResponseObject(), 401);
      }
      if (error instanceof InsufficientScopeError) {
        context.header(
          "WWW-Authenticate",
          buildWwwAuthenticateHeader(error.errorCode, error.message, protectedResourceMetadataUrl),
        );
        return context.json(error.toResponseObject(), 403);
      }
      if (error instanceof ServerError) return context.json(error.toResponseObject(), 500);
      if (error instanceof OAuthError) return context.json(error.toResponseObject(), 400);
      const serverError = new ServerError("Internal Server Error");
      return context.json(serverError.toResponseObject(), 500);
    }
  });

  app.delete("/mcp", (context) => context.body(null, 200));

  serve({ fetch: app.fetch, port }, () => {
    console.error(`OnBrand remote MCP listening on ${baseUrl}/mcp`);
  });
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exit(1);
});
