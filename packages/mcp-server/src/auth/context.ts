import type { DesignSystemOwner } from "@onbrand/core/design-system/owner";

export type OnbrandScope = "onbrand:read" | "onbrand:write";

export type McpAuthContext = Readonly<{
  ownerUserId: string;
  scopes: readonly string[];
}>;

export class MissingScopeError extends Error {
  constructor(readonly scope: OnbrandScope) {
    super(`This action requires the '${scope}' scope.`);
    this.name = "MissingScopeError";
  }
}

// Per-tool authorization belongs to the MCP adapter. Core Onbrand modules receive only the
// business owner identity after the adapter has authorized the tool call.
export const requireScope = (auth: McpAuthContext, scope: OnbrandScope): void => {
  if (!auth.scopes.includes(scope)) throw new MissingScopeError(scope);
};

export const designSystemOwnerFromMcpAuth = (auth: McpAuthContext): DesignSystemOwner => ({
  ownerUserId: auth.ownerUserId,
});
