import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { OAuthTokenVerifier } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { InvalidTokenError } from "@modelcontextprotocol/sdk/server/auth/errors.js";

export type OAuthAccessTokenVerifierOptions = Readonly<{
  issuer: string;
  audience: string;
  jwksUrl: string;
  requiredScopes: readonly string[];
  ownerIdClaim: string;
}>;

export class OAuthAccessTokenVerifier implements OAuthTokenVerifier {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly options: OAuthAccessTokenVerifierOptions) {
    this.jwks = createRemoteJWKSet(new URL(options.jwksUrl));
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    // Translate every verification failure (expired, wrong issuer/audience, bad signature) into
    // InvalidTokenError so requireBearerAuth responds 401 with a WWW-Authenticate challenge,
    // rather than letting the raw jose error bubble up as a 500.
    let payload: JWTPayload;
    try {
      ({ payload } = await jwtVerify(token, this.jwks, {
        issuer: this.options.issuer,
        audience: this.options.audience,
        requiredClaims: ["aud", "exp"],
      }));
    } catch (error) {
      throw new InvalidTokenError(
        error instanceof Error ? error.message : "OAuth access token is invalid",
      );
    }

    const ownerUserId = stringClaim(payload, this.options.ownerIdClaim);
    if (ownerUserId === undefined || ownerUserId.length === 0) {
      throw new InvalidTokenError(
        `OAuth access token is missing owner identity claim '${this.options.ownerIdClaim}'`,
      );
    }

    const scopes =
      typeof payload.scope === "string" ? payload.scope.split(/\s+/).filter(Boolean) : [];
    if (!this.options.requiredScopes.every((scope) => scopes.includes(scope))) {
      throw new InvalidTokenError("OAuth access token is missing required scope");
    }

    return {
      token,
      clientId: typeof payload.client_id === "string" ? payload.client_id : "oauth-client",
      scopes,
      expiresAt: payload.exp,
      resource: new URL(this.options.audience),
      extra: { ownerUserId },
    };
  }
}

const stringClaim = (payload: JWTPayload, name: string): string | undefined => {
  if (name === "sub") return payload.sub;
  const value = payload[name];
  return typeof value === "string" ? value : undefined;
};

export const ownerUserIdFromAuthInfo = (auth: AuthInfo | undefined): string => {
  const ownerUserId = auth?.extra?.ownerUserId;
  if (typeof ownerUserId !== "string" || ownerUserId.length === 0) {
    throw new Error("Authenticated request is missing owner identity");
  }
  return ownerUserId;
};
