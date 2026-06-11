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
