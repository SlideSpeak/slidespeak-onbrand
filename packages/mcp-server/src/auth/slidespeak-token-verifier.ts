import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { OAuthTokenVerifier } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { InvalidTokenError } from "@modelcontextprotocol/sdk/server/auth/errors.js";

export type SlideSpeakTokenVerifierOptions = Readonly<{
  issuer: string;
  audience: string;
  jwksUrl: string;
}>;

export class SlideSpeakTokenVerifier implements OAuthTokenVerifier {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly options: SlideSpeakTokenVerifierOptions) {
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
      }));
    } catch (error) {
      throw new InvalidTokenError(
        error instanceof Error ? error.message : "SlideSpeak access token is invalid",
      );
    }

    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      throw new InvalidTokenError("SlideSpeak access token is missing subject");
    }

    const scopes =
      typeof payload.scope === "string" ? payload.scope.split(/\s+/).filter(Boolean) : [];

    return {
      token,
      clientId:
        typeof payload.client_id === "string" ? payload.client_id : "slidespeak-oauth-client",
      scopes,
      expiresAt: payload.exp,
      resource: new URL(this.options.audience),
      extra: { ownerUserId: payload.sub },
    };
  }
}

export const ownerUserIdFromAuthInfo = (auth: AuthInfo | undefined): string => {
  const ownerUserId = auth?.extra?.ownerUserId;
  if (typeof ownerUserId !== "string" || ownerUserId.length === 0) {
    throw new Error("Authenticated request is missing SlideSpeak user identity");
  }
  return ownerUserId;
};
