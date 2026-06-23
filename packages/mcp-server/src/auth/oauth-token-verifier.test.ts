import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exportJWK, generateKeyPair, SignJWT, type JWTPayload } from "jose";
import {
  InsufficientScopeError,
  InvalidTokenError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";

import { OAuthAccessTokenVerifier } from "./oauth-token-verifier";

const ISSUER = "https://oauth.example";
const AUDIENCE = "https://onbrand.example/mcp";
const JWKS_URL = "https://oauth.example/.well-known/jwks.json";
const REQUIRED_SCOPES = ["onbrand:read", "onbrand:write"] as const;

type PrivateKey = Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];
type PublicKey = Awaited<ReturnType<typeof generateKeyPair>>["publicKey"];

let privateKey: PrivateKey;
let publicKey: PublicKey;

beforeEach(async () => {
  ({ privateKey, publicKey } = await generateKeyPair("RS256"));
  vi.stubGlobal("fetch", vi.fn(jwksResponse));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OAuthAccessTokenVerifier", () => {
  it("accepts a token with the derived MCP audience in an audience array", async () => {
    const token = await signToken({
      audience: ["https://other.example/mcp", AUDIENCE],
      scope: " onbrand:read  onbrand:write ",
    });

    const authInfo = await verifier().verifyAccessToken(token);

    expect(authInfo.resource?.toString()).toBe(AUDIENCE);
    expect(authInfo.scopes).toEqual(REQUIRED_SCOPES);
    expect(authInfo.extra?.ownerUserId).toBe("owner-123");
  });

  it("uses a configured owner identity claim instead of sub", async () => {
    const token = await signToken({
      claims: { account_user_id: "account-owner-456" },
      ownerIdClaim: "account_user_id",
      subject: undefined,
    });

    await expect(
      verifier({ ownerIdClaim: "account_user_id" }).verifyAccessToken(token),
    ).resolves.toMatchObject({
      extra: { ownerUserId: "account-owner-456" },
    });
  });

  it("accepts a read-only token when the caller only requires the MCP read scope", async () => {
    const token = await signToken({ scope: "onbrand:read" });

    await expect(
      verifier({ requiredScopes: ["onbrand:read"] }).verifyAccessToken(token),
    ).resolves.toMatchObject({
      scopes: ["onbrand:read"],
      extra: { ownerUserId: "owner-123" },
    });
  });

  it.each([
    ["wrong issuer", () => signToken({ issuer: "https://wrong.example" })],
    ["missing audience", () => signToken({ audience: null })],
    ["wrong audience", () => signToken({ audience: "https://wrong.example/mcp" })],
    ["missing owner identity", () => signToken({ subject: null })],
    ["expired token", () => signToken({ expiresAt: Math.floor(Date.now() / 1000) - 60 })],
    ["bad signature", signTokenWithUntrustedKey],
  ])("rejects a token with %s", async (_name, buildToken) => {
    await expect(verifier().verifyAccessToken(await buildToken())).rejects.toBeInstanceOf(
      InvalidTokenError,
    );
  });

  it.each([
    ["missing scopes", () => signToken({ scope: null })],
    ["incomplete scopes", () => signToken({ scope: "onbrand:read" })],
  ])("rejects a token with %s as insufficient scope", async (_name, buildToken) => {
    await expect(verifier().verifyAccessToken(await buildToken())).rejects.toBeInstanceOf(
      InsufficientScopeError,
    );
  });

  it("fails closed when the JWKS endpoint cannot be fetched", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unavailable", { status: 503 })),
    );

    await expect(verifier().verifyAccessToken(await signToken())).rejects.toBeInstanceOf(
      InvalidTokenError,
    );
  });
});

const verifier = (
  overrides: Partial<ConstructorParameters<typeof OAuthAccessTokenVerifier>[0]> = {},
): OAuthAccessTokenVerifier =>
  new OAuthAccessTokenVerifier({
    issuer: ISSUER,
    audience: AUDIENCE,
    jwksUrl: JWKS_URL,
    requiredScopes: REQUIRED_SCOPES,
    ownerIdClaim: "sub",
    ...overrides,
  });

const signToken = async ({
  audience = AUDIENCE,
  claims = {},
  expiresAt = Math.floor(Date.now() / 1000) + 3600,
  issuer = ISSUER,
  ownerIdClaim = "sub",
  scope = REQUIRED_SCOPES.join(" "),
  subject = "owner-123",
}: Readonly<{
  audience?: string | readonly string[] | null;
  claims?: JWTPayload;
  expiresAt?: number;
  issuer?: string;
  ownerIdClaim?: string;
  scope?: string | null;
  subject?: string | null;
}> = {}): Promise<string> => {
  let jwt = new SignJWT(scope === null ? claims : { ...claims, scope })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(issuer)
    .setExpirationTime(expiresAt)
    .setIssuedAt();

  if (audience !== null) {
    const audienceClaim: string | string[] =
      typeof audience === "string" ? audience : [...audience];
    jwt = jwt.setAudience(audienceClaim);
  }
  if (subject !== null && ownerIdClaim === "sub") jwt = jwt.setSubject(subject);

  return jwt.sign(privateKey);
};

const signTokenWithUntrustedKey = async (): Promise<string> => {
  const { privateKey: untrustedPrivateKey } = await generateKeyPair("RS256");
  return new SignJWT({ scope: REQUIRED_SCOPES.join(" ") })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject("owner-123")
    .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
    .sign(untrustedPrivateKey);
};

const jwksResponse = async (): Promise<Response> => {
  const jwk = await exportJWK(publicKey);
  return new Response(JSON.stringify({ keys: [{ ...jwk, kid: "test-key", alg: "RS256" }] }), {
    headers: { "Content-Type": "application/json" },
  });
};
