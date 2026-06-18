# Brand Kit Assets as S3 Downloads

Brand Kit visuals such as Logos and Decorative Assets are stored in S3 object storage. Postgres
stores the governed Brand Guide metadata and each Brand Kit Asset's object key, byte size, and
checksum. Clients discover declared visuals through `get_brand_guide` and call
`materialize_brand_kit_assets` to receive target paths plus short-lived presigned S3 download URLs.
The client runs the returned shell commands in its own workspace to download exact bytes before
referencing the files from generated artifacts.

Onbrand is served over HTTPS, so the MCP server and client do not share a filesystem; returning
paths created inside the server container would be misleading and unusable for remote callers.
Returning base64 file contents directly through MCP is also a poor fit: large images pollute the
transcript and force the model to mediate binary data. S3 presigned downloads keep MCP responses
small, avoid server filesystem coupling, preserve per-user authorization at lookup time, and let
object storage handle binary delivery efficiently.
