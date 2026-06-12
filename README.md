![OnBrand](assets/onbrand_banner.webp)

SlideSpeak Onbrand gives AI agents access to governed design knowledge, so they produce content
matching your brand.

## Available tools

- `list_design_systems` — lists available Design Systems.
- `get_design_system` — returns the Brand Kit and Presentation Kit for a Design System id.
- `materialize_brand_kit_assets` — returns short-lived S3 download URLs and shell commands that copy
  approved Brand Kit visual files into the client's workspace.

## Remote MCP over HTTP + OAuth

Onbrand is served over Streamable HTTP at `/mcp`, signed in with a SlideSpeak account. Asset bytes
live in S3 object storage and are downloaded through short-lived presigned URLs, so the model never
has to copy binary payloads through the chat transcript.

### Run

```sh
docker compose up -d --build   # Postgres + HTTP MCP server on :8080
bun run assets:upload-s3       # one-time upload of legacy DB asset bytes to S3 metadata
```

### Connect (Codex)

```sh
codex mcp add onbrand --url http://localhost:8080/mcp
codex mcp login onbrand        # opens the browser sign-in; re-run to re-authorize
```
