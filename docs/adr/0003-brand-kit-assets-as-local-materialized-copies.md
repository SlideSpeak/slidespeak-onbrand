# Brand Kit Assets as Local Materialized Copies

Brand Kit visuals such as Logos and Decorative Assets are exposed to MCP clients as metadata plus
materialization handles, not as MCP Resources or inline file contents. Clients discover declared
visuals through `get_design_system` and call `materialize_brand_kit_assets` to copy them into the
user's workspace before referencing them, because the intended workflow is to reuse approved local
files in generated artifacts rather than spend model context on SVG text or image bytes.
