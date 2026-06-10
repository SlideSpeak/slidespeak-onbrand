![OnBrand](assets/onbrand_banner.webp)

SlideSpeak Onbrand gives AI agents access to governed design knowledge, so they produce content
matching your brand.

## Quick start

```sh
bun install
bun run mcp:watch
```

This starts the local stdio MCP server from source in watch mode.

## Connect to an MCP client

Run these commands from this repository root.

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
- `get_brand_kit` — returns the Brand Kit for a Design System id.

## Example Design Systems

Examples live under `examples/design-systems`. Each example has a `design-system.json` file with
Brand Kit Color Tokens.
