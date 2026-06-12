# V1 MCP Server Architecture

SlideSpeak Onbrand v1 is a TypeScript/Node MCP server using ESM, Bun for package scripts,
Node-compatible runtime code, and the official `@modelcontextprotocol/sdk`. The first implementation
is tools-first over stdio, with a transport-agnostic core and only `list_design_systems` plus
`get_brand_kit`. Tool responses use structured MCP results as the source of truth and include the
same serialized JSON in text content for client compatibility.

Superseded storage note: the initial file-backed Design System Registry has been replaced by the
Prisma Postgres Design System Registry.
