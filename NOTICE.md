# OnBrand by SlideSpeak Notice

This notice records the best-known provenance for public visual assets, rendered third-party marks,
and visual dependencies in this repository. It supplements the repository license; it does not grant
rights to third-party trademarks or brand assets.

Third-party product names and marks are used only to identify compatible MCP clients or supporting
services. OnBrand by SlideSpeak is not affiliated with, endorsed by, or sponsored by OpenAI,
Anthropic, Cursor, Google, or Hugeicons unless a separate written agreement says otherwise.

## Asset Inventory

| Asset or rendered visual     | Files or locations                                                                                                                                | Best-known source and owner                                                                                                                                                                                                                     | Status                                                                                                                                                                                                    | Use rationale                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| OnBrand repository banner    | `assets/onbrand_banner.webp`; duplicate served by the dashboard at `packages/dashboard/public/onbrand-banner.webp`                                | OnBrand by SlideSpeak project artwork. The source design file, designer, and any generation prompt are not recorded in the repository history.                                                                                                  | Best known as SlideSpeak or project-owned artwork. The duplicate files are byte-identical. Owner confirmation of the original source file and generation status is still needed before public visibility. | README hero image and dashboard Open Graph/Twitter preview image.                             |
| OnBrand dashboard logo       | `packages/dashboard/src/assets/onbrand-logo.svg`; `packages/dashboard/src/assets/onbrand-logo.webp`                                               | OnBrand by SlideSpeak project artwork added with the dashboard implementation. The repository does not record the original design source file.                                                                                                  | Best known as SlideSpeak or project-owned artwork. Owner confirmation of original authorship/source remains needed before public visibility.                                                              | Dashboard header logo and favicon.                                                            |
| OpenAI/Codex client mark     | `assets/codex_icon.svg`; inline `CodexIcon` in `packages/dashboard/src/app/dashboard-app.tsx`                                                     | OpenAI mark used to identify Codex as a compatible MCP client. OpenAI states that the OpenAI name, logo, ChatGPT, GPT, and other OpenAI trademarks are property of OpenAI.                                                                      | Third-party trademark/copyright material. Used only for nominative client identification and not as an OnBrand or SlideSpeak brand asset.                                                                 | README setup instructions and dashboard MCP client selector.                                  |
| Claude Code client mark      | `assets/claude_code_icon.svg`; inline `ClaudeCodeIcon` in `packages/dashboard/src/app/dashboard-app.tsx`                                          | Anthropic/Claude mark used to identify Claude Code as a compatible MCP client. Anthropic publishes official brand identity resources for Anthropic visual styling.                                                                              | Third-party trademark/copyright material. Used only for nominative client identification and not as an OnBrand or SlideSpeak brand asset.                                                                 | README setup instructions and dashboard MCP client selector.                                  |
| Cursor client mark           | Inline `CursorIcon` in `packages/dashboard/src/app/dashboard-app.tsx`                                                                             | Cursor mark used to identify Cursor as a compatible MCP client. Cursor's publisher terms identify Anysphere's name, trademarks, and logos as Anysphere-owned brand assets and say the product should be referred to as "Cursor".                | Third-party trademark/copyright material. Used only for nominative client identification and not as an OnBrand or SlideSpeak brand asset.                                                                 | Dashboard MCP client selector.                                                                |
| Figtree font                 | Google Fonts CSS import in `packages/dashboard/src/styles.css`                                                                                    | Figtree by Erik D. Kennedy, loaded from Google Fonts. Google Fonts metadata lists the license as `ofl`, and Google Fonts states its fonts are open source, free to use, and usable commercially. No font files are vendored in this repository. | Third-party open font served through Google Fonts under the SIL Open Font License. Preserve the Google Fonts import/license source if self-hosting in the future.                                         | Dashboard typography.                                                                         |
| Hugeicons UI icons           | `@hugeicons/core-free-icons` and `@hugeicons/react` dependencies in `package.json`; rendered across dashboard controls                            | Hugeicons package icons. The pinned package metadata reports MIT license for `@hugeicons/core-free-icons@4.2.0` and `@hugeicons/react@1.1.7`.                                                                                                   | Third-party open source icon dependency. No Hugeicons source asset files are vendored directly in this repository.                                                                                        | Generic dashboard controls such as copy, theme, select, upload, delete, and navigation icons. |
| Procedural dashboard texture | Inline SVG data URI `GRAIN_TEXTURE` in `packages/dashboard/src/app/dashboard-app.tsx`; CSS animation rules in `packages/dashboard/src/styles.css` | Project-authored procedural texture and styling code.                                                                                                                                                                                           | Project code, not a third-party visual asset or trademark.                                                                                                                                                | Dashboard background texture and motion treatment.                                            |

## Generated Images And Project-Owned Artwork

The repository does not currently include prompt files, source design files, or embedded metadata
that proves whether the OnBrand banner and logo WebP files were manually designed, generated,
exported from a design tool, or derived from another internal asset. They are documented here as
best-known project artwork because they entered the repository through OnBrand/SlideSpeak project
commits and the public-readiness plan directs keeping the artwork while documenting its provenance.

Before changing the repository to public visibility, the repository owner should confirm:

- the original source and owner for `assets/onbrand_banner.webp`;
- the original source and owner for `packages/dashboard/src/assets/onbrand-logo.svg` and
  `packages/dashboard/src/assets/onbrand-logo.webp`;
- whether any generation tool, third-party stock source, or external contractor contributed to those
  files.

## Audit Basis

Tracked non-code visual and font asset audit:

```sh
git ls-files | rg -i '\.(png|jpe?g|gif|webp|svg|ico|icns|avif|bmp|tiff?|woff2?|ttf|otf)$'
```

Current tracked results:

```txt
assets/claude_code_icon.svg
assets/codex_icon.svg
assets/onbrand_banner.webp
packages/dashboard/public/onbrand-banner.webp
packages/dashboard/src/assets/onbrand-logo.svg
packages/dashboard/src/assets/onbrand-logo.webp
```

No tracked screenshots, standalone Cursor image files, vendored Google font files, or additional
bitmap/vector public artwork were found by that audit.

## Reference Sources

- OpenAI brand guidance: https://openai.com/brand/
- Anthropic brand guidelines: https://www.anthropic.com/brand
- Cursor marketplace publisher terms: https://cursor.com/marketplace-publisher-terms
- Google Fonts Figtree specimen: https://fonts.google.com/specimen/Figtree
- Google Fonts Figtree metadata: https://fonts.google.com/metadata/fonts/Figtree
- Google Fonts FAQ: https://developers.google.com/fonts/faq
