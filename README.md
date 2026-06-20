![OnBrand](assets/onbrand_banner.webp)

SlideSpeak Onbrand gives AI agents access to governed design knowledge, so they produce content
matching your brand.

## Quick start

### Local Dev

You need the `frontend` and `postgresql` running from
[SlideSpeak](https://github.com/SlideSpeak/slidespeak-monorepo).

Then, run `docker compose up` from this repo's root.

Finally, connect via OAuth:

#### <img src="assets/codex_icon.svg" alt="Codex" width="24" height="24" />

```sh
codex mcp add onbrand --url http://localhost:8080/mcp
```

#### <img src="assets/claude_code_icon.svg" alt="Claude Code" width="24" height="24" />

```sh
claude mcp add --transport http onbrand http://localhost:8080/mcp
```

## Available tools

- `get_onbrand_skill` — Get the Onbrand skill for what Onbrand can do and how to use its tools.
- `list_brand_guides` — List Brand Guides available to the current user.
- `get_brand_guide` — Get Brand Guide metadata, Brand Kit tokens, asset handles, and Presentation
  Kit guidance.
- `materialize_brand_kit_assets` — Get S3 download commands for Brand Kit assets such as logos and
  decorative files.
- `get_brand_guide_writer_skill` — Get the skill for authoring a new Brand Guide.
- `prepare_brand_guide_asset_uploads` — Get S3 upload commands for new logo and decorative asset
  files.
- `write_brand_guide` — Create or replace a Brand Guide using uploaded asset references and design
  guidance.
