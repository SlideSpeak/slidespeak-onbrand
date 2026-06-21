![OnBrand](assets/onbrand_banner.webp)

# OnBrand by SlideSpeak

OnBrand by SlideSpeak is an in-development MCP service and dashboard that gives AI agents access to
governed brand knowledge: Brand Guides, Brand Kit assets, color tokens, logo guidance, and
presentation design prompts.

The repository is being prepared for public development as a standalone service. It can run in any
environment where you provide a compatible OAuth provider, Postgres database, and S3 bucket.
Production hardening is not complete yet, so treat the current support level as local and
development deployments only.

## Quick Start

Prerequisites:

- Bun
- Docker and Docker Compose
- An OAuth provider that can issue JWT access tokens for the OnBrand MCP resource
- An S3-compatible AWS bucket for Brand Kit asset storage

Create local configuration from the public example:

```sh
cp .env.example .env
```

Edit `.env` with your local OAuth provider and S3 credentials. The default example assumes:

- OnBrand runs at `http://localhost:8080`.
- The OAuth browser endpoints run at `http://localhost:3000`.
- Container-to-provider token and JWKS calls use `http://host.docker.internal:3000`.
- Access tokens include the `onbrand:read` and `onbrand:write` scopes as needed.
- The token audience/resource is `http://localhost:8080/mcp`.

Start the service:

```sh
docker compose up --build
```

OnBrand exposes:

```txt
http://localhost:8080/health
http://localhost:8080/mcp
http://localhost:8080/dashboard
http://localhost:8080/.well-known/oauth-protected-resource/mcp
```

Connect an MCP client:

Third-party product names and marks in these examples identify compatible MCP clients only. See
[NOTICE.md](NOTICE.md) for asset and trademark provenance.

#### <img src="assets/codex_icon.svg" alt="Codex" width="24" height="24" />

```sh
codex mcp add onbrand --url http://localhost:8080/mcp
codex mcp login onbrand
```

#### <img src="assets/claude_code_icon.svg" alt="Claude Code" width="24" height="24" />

```sh
claude mcp add --transport http onbrand http://localhost:8080/mcp
```

## Configuration

See [the auth and runtime configuration guide](packages/mcp-server/src/auth/README.md) for the full
environment variable table, OAuth provider contract, dashboard session secret guidance, S3 setup
notes, and production checklist.

Required environment variables for a real deployment:

| Variable                         | Purpose                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------- |
| `DATABASE_URL`                   | Postgres connection string.                                                     |
| `BASE_URL`                       | Public OnBrand origin; derives dashboard social metadata and `${BASE_URL}/mcp`. |
| `OAUTH_ISSUER`                   | Expected JWT issuer.                                                            |
| `OAUTH_AUTHORIZATION_ENDPOINT`   | Browser authorization endpoint.                                                 |
| `OAUTH_TOKEN_ENDPOINT`           | Token exchange endpoint.                                                        |
| `OAUTH_JWKS_URL`                 | JWKS endpoint used to verify access token signatures.                           |
| `OAUTH_DASHBOARD_CLIENT_ID`      | Static dashboard OAuth client ID.                                               |
| `OAUTH_REQUIRED_READ_SCOPE`      | Read scope required by read-only MCP tools.                                     |
| `OAUTH_REQUIRED_WRITE_SCOPE`     | Write scope required by mutating MCP tools.                                     |
| `DASHBOARD_SESSION_SECRET`       | Secret used to sign dashboard session cookies.                                  |
| `AWS_S3_BUCKET_BRAND_KIT_ASSETS` | Bucket for uploaded Brand Kit assets.                                           |
| `AWS_REGION`                     | AWS region for the Brand Kit asset bucket.                                      |
| `AWS_ACCESS_KEY_ID`              | AWS access key for S3 operations.                                               |
| `AWS_SECRET_ACCESS_KEY`          | AWS secret access key for S3 operations.                                        |

Optional environment variables:

| Variable                            | Purpose                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `OAUTH_REGISTRATION_ENDPOINT`       | Dynamic client registration endpoint advertised to MCP clients.          |
| `OAUTH_REQUIRED_READ_SCOPE`         | Read scope required by read-only MCP tools. Defaults to `onbrand:read`.  |
| `OAUTH_REQUIRED_WRITE_SCOPE`        | Write scope required by mutating MCP tools. Defaults to `onbrand:write`. |
| `OAUTH_OWNER_ID_CLAIM`              | JWT claim used as the OnBrand owner identifier. Defaults to `sub`.       |
| `ASSET_DOWNLOAD_EXPIRES_IN_SECONDS` | Presigned S3 URL lifetime. Defaults to `900`.                            |
| `DASHBOARD_DEV_SERVER_URL`          | Development-only dashboard Vite proxy URL used by `docker-compose.yml`.  |

## Available Tools

- `get_onbrand_skill` - Get the OnBrand skill for what OnBrand can do and how to use its tools.
- `list_brand_guides` - List Brand Guides available to the current user.
- `get_brand_guide` - Get Brand Guide metadata, Brand Kit tokens, asset handles, and Presentation
  Kit guidance.
- `materialize_brand_kit_assets` - Get S3 download commands for Brand Kit assets such as logos and
  decorative files.
- `get_brand_guide_writer_skill` - Get the skill for authoring a new Brand Guide.
- `prepare_brand_guide_asset_uploads` - Get S3 upload commands for new logo and decorative asset
  files.
- `write_brand_guide` - Create or replace a Brand Guide using uploaded asset references and design
  guidance.

## Development

Useful checks:

```sh
bun run format:check
bun run lint
bun run typecheck
bun run test
bun run build
bun run react-doctor:check
```

This repository is not publishing packages to npm yet. The workspace packages are intended for this
service first.

## Contributing And Governance

This project is in development, and contributions should start with a GitHub Discussion or issue so
the maintainers can align on product direction and support level before code is written.

For this public-readiness pass, `SECURITY.md`, `CONTRIBUTING.md`, pull request and issue templates,
and a Code of Conduct are intentionally out of scope. Please avoid treating their absence as a
signal that those policies are finalized.
