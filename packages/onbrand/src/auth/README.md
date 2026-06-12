# OnBrand MCP OAuth

## Local

Run SlideSpeak web app on `localhost:3000`, then start OnBrand:

```sh
docker compose up -d
```

OnBrand endpoints:

```txt
http://localhost:8080/health
http://localhost:8080/mcp
http://localhost:8080/.well-known/oauth-protected-resource/mcp
```

Local env defaults:

```env
ONBRAND_BASE_URL=http://localhost:8080
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
SLIDESPEAK_OAUTH_ISSUER=http://localhost:3000
SLIDESPEAK_JWKS_URL=http://host.docker.internal:3000/oauth/jwks.json
DATABASE_URL=postgresql://onbrand:onbrand@localhost:5433/onbrand?schema=public
```

Connect Codex:

```sh
codex mcp add onbrand --url http://localhost:8080/mcp
codex mcp login onbrand
```

## Prod

Deploy the OnBrand container behind HTTPS, e.g.:

```txt
https://onbrand-mcp.slidespeak.co
```

Required env:

```env
BASE_URL=https://onbrand-mcp.slidespeak.co
PORT=8080
CORS_ALLOWED_ORIGINS=https://app.slidespeak.co
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/onbrand?schema=public
SLIDESPEAK_OAUTH_ISSUER=https://app.slidespeak.co
SLIDESPEAK_JWKS_URL=https://app.slidespeak.co/oauth/jwks.json
```

`BASE_URL` must match the public MCP URL clients use. Tokens are accepted only when their
audience/resource is:

```txt
${BASE_URL}/mcp
```
