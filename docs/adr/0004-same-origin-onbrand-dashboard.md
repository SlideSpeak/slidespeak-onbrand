# Same-origin Onbrand Dashboard

Onbrand will serve the browser-based Onbrand Dashboard from the same origin as its existing MCP and
API surfaces.

```txt
https://onbrand.slidespeak.co/
  /              Onbrand Dashboard
  /api/*         dashboard JSON API
  /mcp           MCP endpoint
  /.well-known/* OAuth/MCP discovery metadata
```

The Onbrand Dashboard is a React/Vite single-page app served by the existing Hono service. Browser
users authenticate through SlideSpeak OAuth using a static first-party OAuth client and receive an
Onbrand HttpOnly session cookie. MCP clients continue to authenticate with bearer access tokens on
`/mcp`.

This keeps the first product surface simple: one domain, one TLS configuration, one `BASE_URL`, no
CORS, no cross-subdomain cookie policy, and no separate frontend deployment. It also keeps ownership
boundaries intact: SlideSpeak remains the identity, account, and billing system; Onbrand remains the
owner of Brand Guides, Brand Kits, Presentation Kits, assets, MCP tools, and dashboard APIs.

A future split to `app.onbrand.slidespeak.co` remains possible if the dashboard outgrows same-origin
serving or needs independent deployment.
