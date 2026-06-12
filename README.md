![OnBrand](assets/onbrand_banner.webp)

SlideSpeak Onbrand gives AI agents access to governed design knowledge, so they produce content
matching your brand.

## Quick start

Run any of these commands from this repository root.

Codex CLI:

```sh
codex mcp add onbrand -- bun run --cwd "$PWD" --silent mcp
```

Claude Code CLI:

```sh
claude mcp add --transport stdio onbrand -- bun run --cwd "$PWD" --silent mcp
```

## Available tools

- `list_design_systems` — lists available Design Systems.
- `get_design_system` — returns the Brand Kit and Presentation Kit for a Design System id.
- `materialize_brand_kit_assets` — copies approved Brand Kit visual assets into a workspace.

## Remote (HTTP + OAuth)

The stdio server above runs locally and unauthenticated. The remote server (`bun run mcp:http`)
exposes the same tools over streamable HTTP at `/mcp`, protected by SlideSpeak's OAuth. Each request
is authenticated with a SlideSpeak-issued RS256 access token; the token's `sub` scopes every
Design System lookup to that user, so Design Systems are isolated per owner.

SlideSpeak (the monorepo web app) is the authorization server — it handles registration, consent,
and token issuance/refresh. This server is only the resource server: it validates access tokens
against SlideSpeak's published JWKS. See `frontend/app/src/app/oauth/README.md` in the monorepo for
the authorization-server setup.

### Run with Docker

```sh
docker compose up -d --build
```

This starts Postgres and the HTTP MCP server (port 8080), reaching the host's SlideSpeak dev server
via `host.docker.internal`. Configure via `.env` (see `.env.example`):

```env
ONBRAND_BASE_URL=http://localhost:8080
SLIDESPEAK_OAUTH_ISSUER=http://localhost:3000
SLIDESPEAK_JWKS_URL=http://host.docker.internal:3000/oauth/jwks.json
```

### Environment

- `BASE_URL` — public URL of this server; `/mcp` is derived from it and used as the token audience
  (RFC 8707 resource). docker-compose maps `ONBRAND_BASE_URL` to this.
- `SLIDESPEAK_OAUTH_ISSUER` — SlideSpeak issuer base URL; access tokens must carry this `iss`.
- `SLIDESPEAK_JWKS_URL` — JWKS endpoint (defaults to `${issuer}/oauth/jwks.json`).
- `DATABASE_URL` — Postgres connection string.

### Connect a client

Point an MCP client at `${BASE_URL}/mcp`; it discovers the authorization server from the
`/mcp` metadata. For Codex CLI:

```sh
codex mcp add onbrand --url http://localhost:8080/mcp
codex mcp login onbrand   # opens the browser consent flow and stores the token
```

`codex mcp login onbrand` is also how you re-authorize after a token is revoked. Access tokens
last 15 minutes and are refreshed silently; you only re-run `login` if the 30-day refresh token
lapses or the grant is revoked.
