## Problem Statement

The Onbrand Dashboard currently lets authenticated users view Brand Guides, but it does not provide a complete browser-native way to create, edit, or delete them. Users who create Brand Guides through agent/MCP workflows cannot comfortably maintain Brand Guide metadata, Brand Kit content, Presentation Kit content, or governed assets from the dashboard. Empty states also push users only toward agent prompting, even though the dashboard is becoming the product surface for managing Brand Guides.

## Solution

Add a full Brand Guide management surface to the Onbrand Dashboard. A Brand Guide remains the top-level editable resource; its Brand Kit and Presentation Kit are edited inside that Brand Guide rather than managed as independent resources. Users can create a Brand Guide with only a required unique name and optional description, then fill in Brand Kit and Presentation Kit content inline over time. Brand Kits and Presentation Kits may be completely empty, and absent singular values are represented as `null` while collections are represented as empty arrays.

The dashboard uses smooth inline autosave backed by granular patch operations, not whole-aggregate writes. Users can edit Brand Guide metadata, Color Tokens, Logo, Decorative Assets, Slide Canvas, and Design Prompt. Asset files upload directly from the browser to S3 via presigned PUT URLs, then the dashboard persists asset metadata. Deletes are explicit and irreversible: every delete prompts with a dialog, Brand Guide delete requires typing the Brand Guide name, and asset/Brand Guide deletes synchronously clean up S3 before removing database records.

## User Stories

1. As an authenticated dashboard user, I want to create a Brand Guide from the dashboard, so that I can start managing governed design knowledge without using an agent first.
2. As an authenticated dashboard user, I want to create a Brand Guide with only a name, so that I can start with an empty shell and fill in details later.
3. As an authenticated dashboard user, I want Brand Guide names to be unique, so that I can distinguish Brand Guides in selectors, URLs, and agent-facing lists.
4. As an authenticated dashboard user, I want the Brand Guide slug to be derived from the name on creation and remain stable afterward, so that URLs and MCP references do not break when I rename a Brand Guide.
5. As an authenticated dashboard user, I want to edit the Brand Guide name inline in the top bar, so that renaming feels fast and direct.
6. As an authenticated dashboard user, I want invalid or duplicate Brand Guide names to show validation and not save, so that persisted Brand Guides remain valid.
7. As an authenticated dashboard user, I want to edit the optional Brand Guide description from a details popover or dialog, so that metadata remains discoverable without crowding the main editing sections.
8. As an authenticated dashboard user, I want autosave feedback with subtle saving/saved/error icons, so that I know whether my changes persisted.
9. As an authenticated dashboard user, I want autosave failures to show a toast with retry, so that transient errors do not silently lose my work.
10. As an authenticated dashboard user, I want my local edit to remain visible when autosave fails, so that I can retry or fix it without retyping.
11. As an authenticated dashboard user, I want invalid inline edits to remain unsaved with clear validation, so that invalid data is not persisted.
12. As an authenticated dashboard user, I want the empty dashboard state to offer both dashboard creation and an agent prompt separated by an “Or”, so that I can choose either workflow.
13. As an authenticated dashboard user, I want to land on the new Brand Guide’s Colors section after creation, so that I can immediately begin filling the Brand Kit.
14. As an authenticated dashboard user, I want to delete a Brand Guide from a top-bar overflow menu, so that destructive actions are separate from routine editing.
15. As an authenticated dashboard user, I want Brand Guide deletion to require typing the Brand Guide name, so that irreversible deletion is deliberate.
16. As an authenticated dashboard user, I want Brand Guide deletion to clean up both database records and S3 asset objects, so that no governed asset files are orphaned.
17. As an authenticated dashboard user, I want Brand Guide deletion to fail safely if S3 cleanup fails, so that the Brand Guide remains available for retry instead of partially disappearing.
18. As an authenticated dashboard user, I want to navigate to the next available Brand Guide after deleting the current one, so that I can continue working smoothly.
19. As an authenticated dashboard user, I want to see the empty state after deleting the final Brand Guide, so that I understand there are no remaining Brand Guides.
20. As an authenticated dashboard user, I want Color Tokens to be editable inside the Brand Kit, so that I can maintain brand color guidance from the dashboard.
21. As an authenticated dashboard user, I want to add Color Tokens with a name, hex value, and optional description, so that agents receive role-aware color guidance.
22. As an authenticated dashboard user, I want Color Token IDs to be derived from names, so that I do not have to manage technical identifiers manually.
23. As an authenticated dashboard user, I want Color Token names to be unique within a Brand Kit, so that derived identifiers remain clear and stable.
24. As an authenticated dashboard user, I want Color Token values to accept only `#RRGGBB` hex colors, so that color data remains predictable.
25. As an authenticated dashboard user, I want colors displayed using the dashboard’s existing color ordering, so that the editing UI remains consistent with current viewing behavior.
26. As an authenticated dashboard user, I want to delete a Color Token only after confirming an irreversible dialog, so that accidental deletes are avoided.
27. As an authenticated dashboard user, I want the Brand Kit to allow no colors, so that a Brand Guide can exist before color guidance is known.
28. As an authenticated dashboard user, I want to add, replace, and delete the single Logo, so that the Brand Kit can evolve over time.
29. As an authenticated dashboard user, I want the Logo to expose a file and optional usage description, so that agents know how to use the logo without me managing a redundant logo name.
30. As an authenticated dashboard user, I want to delete the Logo only after an irreversible confirmation dialog, so that I do not accidentally remove governed assets.
31. As an authenticated dashboard user, I want Logo deletion to remove the S3 object before removing the database reference, so that asset cleanup is complete.
32. As an authenticated dashboard user, I want the Brand Kit to allow no Logo, so that a Brand Guide can exist before a logo is uploaded.
33. As an authenticated dashboard user, I want to add Decorative Assets with a name, description, and file, so that agents can use reusable visual accents correctly.
34. As an authenticated dashboard user, I want Decorative Asset IDs to be derived from unique names, so that I do not have to manage technical identifiers manually.
35. As an authenticated dashboard user, I want Decorative Assets treated as an unordered collection, so that I do not spend time managing order that has no product meaning.
36. As an authenticated dashboard user, I want to replace Decorative Asset files, so that I can update governed asset bytes while preserving the asset concept.
37. As an authenticated dashboard user, I want to delete Decorative Assets only after an irreversible confirmation dialog, so that accidental deletes are avoided.
38. As an authenticated dashboard user, I want Decorative Asset deletion to remove the S3 object before removing the database reference, so that asset cleanup is complete.
39. As an authenticated dashboard user, I want the Brand Kit to allow no Decorative Assets, so that assets can be added only when they exist.
40. As an authenticated dashboard user, I want browser asset uploads to support SVG, PNG, JPEG, and WebP, so that currently supported Brand Kit asset formats work in the dashboard.
41. As an authenticated dashboard user, I want uploaded asset files limited to 10 MB, so that invalid or oversized files fail early in the browser.
42. As an authenticated dashboard user, I want both drag-and-drop and file picker uploads, so that asset upload is smooth and accessible.
43. As an authenticated dashboard user, I want the browser to upload asset files directly to S3 using presigned URLs, so that large files do not pass through the dashboard API server.
44. As an authenticated dashboard user, I want to edit the Presentation Kit Slide Canvas, so that generated presentations can use the correct coordinate space.
45. As an authenticated dashboard user, I want Slide Canvas width and height editable with fixed `px` units, so that canvas data matches the current domain model.
46. As an authenticated dashboard user, I want Slide Canvas to be clearable, so that the Presentation Kit can be empty when dimensions are unknown.
47. As an authenticated dashboard user, I want to edit the Design Prompt in a plain multiline textarea, so that I can maintain agent-facing slide guidance without a heavy editor.
48. As an authenticated dashboard user, I want Design Prompt to be optional and clearable, so that the Presentation Kit can start empty.
49. As an MCP client user, I want agents to see all Brand Guides including empty or partially filled ones, so that dashboard-created Brand Guides are discoverable immediately.
50. As an MCP client user, I want agents to receive explicit empty values such as `logo: null`, `canvas: null`, and empty arrays, so that they can reason about missing content without a separate readiness state.
51. As an Onbrand maintainer, I want MCP write tools to remain unchanged for this pass, so that dashboard CRUD does not expand the agent tool surface prematurely.
52. As an Onbrand maintainer, I want Brand Guides to remain user-owned for this pass, so that team/account ownership does not expand the feature scope.

## Implementation Decisions

- The Brand Guide remains the top-level editable resource. Brand Kit and Presentation Kit are edited as contained parts of a Brand Guide, not as independently managed resources.
- Brand Guides require a unique name per owner. Description is optional and represented as `null` when absent.
- Brand Guide slugs are derived from the name during creation and remain stable after creation, even when the display name changes.
- Brand Kit may be empty. Its collection fields are empty arrays when absent, and its singular Logo is `null` when absent.
- Presentation Kit may be empty. Slide Canvas is `null` when absent, and Design Prompt is `null` when absent.
- No explicit readiness, completeness, or publication state is introduced. Dashboard and MCP clients infer available content from the returned Brand Guide data.
- The dashboard uses granular autosave patch operations instead of whole-aggregate writes. This is recorded in ADR 0005.
- Autosave is simple last-write-wins at the field or section level. Different fields should not overwrite each other.
- Autosave successes use subtle inline status with icons. Autosave failures show a toast with retry and preserve the local edit.
- Invalid edits are not persisted. The UI shows validation until the value is corrected.
- The create flow asks for a required unique name and optional description. After creation, users land on the new Brand Guide’s Colors section.
- The empty state presents dashboard creation and agent prompting as equal options, separated by “Or”.
- Brand Guide name is editable inline in the top bar. Brand Guide description is edited from a details popover or dialog. Brand Guide delete lives in a separate top-bar overflow menu.
- Brand Guide delete is a hard delete with type-to-confirm using the Brand Guide name. The dialog must state that the action cannot be reverted.
- Brand Guide delete synchronously deletes S3 asset objects before deleting database records. If S3 cleanup fails, the database records remain and the user can retry.
- Individual deletes also require irreversible confirmation dialogs. Type-to-confirm is only required for Brand Guide deletion.
- Clearing optional fields is normal editing, not deletion, and does not require a confirmation dialog.
- Asset-level deletes are synchronous and all-or-nothing: delete S3 object first, then remove the database record; if S3 delete fails, keep the database record.
- Dashboard asset upload uses browser direct-to-S3 presigned PUT URLs followed by metadata persistence through dashboard APIs.
- Dashboard uploads accept SVG, PNG, JPEG, and WebP with a 10 MB maximum per asset.
- Upload controls support both drag-and-drop and file picker.
- Brand Kit Logo remains exactly one Logo for now. The Logo exposes file and optional usage description, not an editable name or asset ID.
- Decorative Assets expose name, optional description, and file. Their IDs are derived from unique names. They are treated as an unordered collection in the UI.
- Color Tokens expose name, `#RRGGBB` hex value, and optional description. Their token IDs are derived from unique names. They are displayed with the dashboard’s existing color ordering.
- Presentation Kit editing exposes both Slide Canvas and Design Prompt. Slide Canvas width and height are editable; unit remains fixed to `px`. Slide Canvas is clearable.
- Design Prompt editing uses a plain autosaving multiline textarea.
- MCP write tools stay as-is for this pass. MCP read tools must tolerate and return sparse Brand Guides with empty Brand Kits or Presentation Kits.
- Brand Guides remain owned by the authenticated user. Team/account ownership, roles, and permissions are not introduced.
- Major modules to build or modify include: Brand Guide domain schemas and view mapping for sparse kits; dashboard API granular patch and delete routes; S3 deletion support; dashboard autosave state handling; dashboard create/delete flows; inline metadata editing; Brand Kit color/logo/decorative asset editors; Presentation Kit editor; MCP read serialization tolerance for empty content.
- Good deep modules to extract include: an autosave controller/hook with a small interface for pending/saved/error states; a Brand Guide patch application/service layer that owns validation and field-level persistence; an asset upload workflow that encapsulates presigned upload, browser PUT, metadata save, and cleanup-on-delete semantics; reusable confirmation dialog primitives for irreversible deletes; and domain mappers for nullable/empty Brand Kit and Presentation Kit views.

## Testing Decisions

- Tests should assert external behavior and domain contracts rather than internal React state or implementation details.
- Domain/application tests should cover creating a Brand Guide with only a name, optional description behavior, sparse Brand Kit and Presentation Kit views, nullable Logo and Slide Canvas, empty arrays for collections, and name uniqueness.
- Application/service tests should cover granular patch operations not overwriting unrelated sections.
- Delete tests should cover all-or-nothing behavior: S3 objects are deleted before database records, database records remain when S3 deletion fails, and cascaded database deletion removes contained Brand Kit and Presentation Kit records.
- Asset workflow tests should cover presigned browser upload metadata, supported MIME types, max file size validation, asset replacement, and asset delete cleanup behavior.
- Dashboard API tests should cover authenticated ownership scoping, create, patch, delete, validation errors, and retryable failure responses.
- Dashboard UI tests should cover empty state choices, create flow navigation, inline name editing, description dialog, autosave status/error behavior, confirmation dialogs, type-to-confirm Brand Guide delete, asset upload interactions, and clearing optional fields.
- MCP/read tests should cover `list_brand_guides` and `get_brand_guide` returning dashboard-created sparse Brand Guides without crashing or inventing defaults.
- Prior art exists in the current PersistentBrandGuideApplication integration tests, MCP server tests using fake BrandGuideApplicationService implementations, and dashboard component/API usage around existing Brand Guide viewing sections.

## Out of Scope

- Independent Brand Kit or Presentation Kit CRUD outside the Brand Guide aggregate.
- Separate draft/published/readiness states.
- MCP granular patch tools for agents.
- Team/account ownership, sharing, roles, or permissions beyond authenticated user ownership.
- Logo variants or multiple logos.
- User-managed ordering for Decorative Assets or Color Tokens.
- Rich Markdown editing or preview for Design Prompt.
- Slide Canvas units other than `px`.
- Color formats other than `#RRGGBB`.
- Soft delete, archive, restore, or asynchronous deletion jobs.
- Adding unsupported asset formats such as PDF, AI, EPS, fonts, or video.

## Further Notes

- The glossary in `CONTEXT.md` has been updated to clarify that Brand Kits and Presentation Kits may be empty, that Slide Canvas is optional, and that the Onbrand Dashboard manages Brand Guides as the top-level editable resource.
- ADR 0005 records the decision to use granular autosave Brand Guide editing rather than whole-aggregate writes.
- The current whole-aggregate `writeBrandGuide` flow deletes and recreates contained records, which is unsafe as the backing operation for inline autosave.
- The current S3 wrapper supports presigned GET and PUT only; deletion support must be added before hard delete cleanup can satisfy the product requirement.
