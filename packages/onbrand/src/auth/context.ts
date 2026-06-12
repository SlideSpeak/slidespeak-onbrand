export const ONBRAND_SCOPES = ["onbrand:read", "onbrand:write"] as const;
export type OnbrandScope = (typeof ONBRAND_SCOPES)[number];

export type AuthContext = Readonly<{
  ownerUserId: string;
  scopes: readonly string[];
}>;

export const LOCAL_DEVELOPMENT_OWNER_USER_ID = "local-dev-user";

export const localDevelopmentAuthContext = (): AuthContext => ({
  ownerUserId: process.env.ONBRAND_OWNER_USER_ID ?? LOCAL_DEVELOPMENT_OWNER_USER_ID,
  scopes: [...ONBRAND_SCOPES],
});

export class MissingScopeError extends Error {
  constructor(readonly scope: OnbrandScope) {
    super(`This action requires the '${scope}' scope.`);
    this.name = "MissingScopeError";
  }
}

// Per-tool authorization. Every tool declares the scope it needs; today all tools are read-only,
// so a future server-side write capability becomes a one-line change to `onbrand:write`.
export const requireScope = (auth: AuthContext, scope: OnbrandScope): void => {
  if (!auth.scopes.includes(scope)) throw new MissingScopeError(scope);
};
