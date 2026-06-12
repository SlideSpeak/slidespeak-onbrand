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

The same tools over HTTP at `/mcp`, signed in with a SlideSpeak account.

### Set env (`.env`, see `.env.example`)

```env
ONBRAND_BASE_URL=http://localhost:8080
SLIDESPEAK_OAUTH_ISSUER=http://localhost:3000
SLIDESPEAK_JWKS_URL=http://host.docker.internal:3000/oauth/jwks.json
DATABASE_URL=postgresql://onbrand:onbrand@localhost:5433/onbrand?schema=public
```

### Run

```sh
docker compose up -d --build   # Postgres + HTTP MCP server on :8080
```

### Connect (Codex)

```sh
codex mcp add onbrand --url http://localhost:8080/mcp
codex mcp login onbrand        # opens the browser sign-in; re-run to re-authorize
```
