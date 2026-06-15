export type OnbrandScope = "onbrand:read" | "onbrand:write";

export type AuthContext = Readonly<{
  ownerUserId: string;
  scopes: readonly string[];
}>;

export class MissingScopeError extends Error {
  constructor(readonly scope: OnbrandScope) {
    super(`This action requires the '${scope}' scope.`);
    this.name = "MissingScopeError";
  }
}

// Per-tool authorization. Every tool declares the scope it needs.
export const requireScope = (auth: AuthContext, scope: OnbrandScope): void => {
  if (!auth.scopes.includes(scope)) throw new MissingScopeError(scope);
};
