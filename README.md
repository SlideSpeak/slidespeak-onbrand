![OnBrand](assets/onbrand_banner.webp)

SlideSpeak Onbrand gives AI agents access to governed design knowledge, so they produce content
matching your brand.

## Quick start

Run Onbrand from this repository root. Onbrand is a remote Streamable HTTP MCP server exposed at
`/mcp` and authenticated with SlideSpeak OAuth.

### Local

#### <img src="assets/codex_icon.svg" alt="Codex" width="24" height="24" />

```sh
codex mcp add onbrand --url http://localhost:8080/mcp
codex mcp login onbrand
```

#### <img src="assets/claude_code_icon.svg" alt="Claude Code" width="24" height="24" />

```sh
claude mcp add --transport http onbrand http://localhost:8080/mcp
```

## Available tools

- `list_design_systems` — lists available Design Systems.
- `get_design_system` — returns the Brand Kit and Presentation Kit for a Design System id.
- `materialize_brand_kit_assets` — returns short-lived presigned S3 download URLs and shell commands
  that copy approved Brand Kit visual files into the client's workspace.
