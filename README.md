![OnBrand](assets/onbrand_banner.webp)

SlideSpeak Onbrand gives AI agents access to governed design knowledge, so they produce content
matching your brand.

## Quick start

### Local Dev

You need the `frontend` and `postgresql` running from
[SlideSpeak](https://github.com/SlideSpeak/slidespeak-monorepo) and `docker compose up` in here.

#### <img src="assets/codex_icon.svg" alt="Codex" width="24" height="24" />

```sh
codex mcp add onbrand --url http://localhost:8080/mcp
```

#### <img src="assets/claude_code_icon.svg" alt="Claude Code" width="24" height="24" />

```sh
claude mcp add --transport http onbrand http://localhost:8080/mcp
```

## Available tools

- `list_design_systems` — List Design Systems available to the current user.
- `get_design_system` — Get Design System metadata, Brand Kit tokens, asset handles, and Presentation Kit guidance.
- `materialize_brand_kit_assets` — Get S3 download commands for Brand Kit assets such as logos and decorative files.
- `get_design_system_writer_prompt` — Get the rubric for authoring a new Design System.
- `prepare_design_system_asset_uploads` — Get S3 upload commands for new logo and decorative asset files.
- `write_design_system` — Create or replace a Design System using uploaded asset references and design guidance.
