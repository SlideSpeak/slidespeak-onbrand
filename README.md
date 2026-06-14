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
- `get_design_system_writer_prompt` — returns the authoring rubric and exemplar structure clients
  should follow before constructing a new Design System.
- `prepare_design_system_asset_uploads` — returns short-lived presigned S3 PUT URLs and shell
  commands so clients upload exact Design System asset files directly to S3 instead of sending bytes
  through MCP.
- `write_design_system` — creates or replaces a complete Design System after the client has analyzed
  user-provided source material such as a URL, PDF, PPTX, image, or existing deck. The client
  supplies color tokens, uploaded logo/decorative asset references, canvas details, and a detailed
  slide Design Prompt; Onbrand persists the result for future `get_design_system` calls.
