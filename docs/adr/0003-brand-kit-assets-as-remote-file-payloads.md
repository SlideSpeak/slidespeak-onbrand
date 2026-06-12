# Brand Kit Assets as Remote File Payloads

Brand Kit visuals such as Logos and Decorative Assets are exposed to remote MCP clients as file
metadata plus base64-encoded file contents. Clients discover declared visuals through
`get_design_system` and call `get_brand_kit_asset_files` to fetch exact bytes, then decode and write
the files into their own workspace before referencing them from generated artifacts.

This replaces local server-side materialization. Onbrand is served over HTTPS, so the MCP server and
client do not share a filesystem; returning paths created inside the server container would be
misleading and unusable for remote callers.
