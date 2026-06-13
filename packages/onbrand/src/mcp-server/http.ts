import { S3 } from "@onbrand/s3";
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  getOAuthProtectedResourceMetadataUrl,
  mcpAuthMetadataRouter,
} from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
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

  const prisma = createPrismaClient();
  const registry = new PrismaDesignSystemRegistry(
    prisma,
    S3,
    StorageBuckets.brandKitAssets,
    assetDownloadExpiresInSeconds,
  );
  const verifier = new SlideSpeakTokenVerifier({ issuer, audience: mcpUrl.toString(), jwksUrl });
  const app = express();

  app.use(express.json({ limit: "4mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use(
    mcpAuthMetadataRouter({
      oauthMetadata: {
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
      },
      resourceServerUrl: mcpUrl,
      resourceName: "SlideSpeak OnBrand MCP",
      scopesSupported: ["onbrand:read", "onbrand:write"],
    }),
  );

  const protectedResourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(mcpUrl);
  const auth = requireBearerAuth({
    verifier,
    requiredScopes: ["onbrand:read"],
    resourceMetadataUrl: protectedResourceMetadataUrl,
  });

  app.post("/mcp", auth, async (req, res) => {
    const ownerUserId = ownerUserIdFromAuthInfo(req.auth);
    const server = createOnbrandMcpServer(registry, {
      ownerUserId,
      scopes: req.auth?.scopes ?? [],
    });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => void transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.get("/mcp", auth, async (req, res) => {
    const ownerUserId = ownerUserIdFromAuthInfo(req.auth);
    const server = createOnbrandMcpServer(registry, {
      ownerUserId,
      scopes: req.auth?.scopes ?? [],
    });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => void transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res);
  });

  app.delete("/mcp", auth, (_req, res) => {
    res.status(200).end();
  });

  app.listen(port, () => {
    console.error(`OnBrand remote MCP listening on ${baseUrl}/mcp`);
  });
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exit(1);
});
