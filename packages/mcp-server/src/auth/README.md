# OnBrand MCP OAuth

## Local

Run a compatible OAuth provider on `localhost:3000`, then start OnBrand from the repository root:

```sh
docker compose up -d
```

OnBrand endpoints:

```txt
http://localhost:8080/health
http://localhost:8080/mcp
http://localhost:8080/.well-known/oauth-protected-resource/mcp
```

Local `.env`:

```env
DATABASE_URL=postgresql://onbrand:onbrand@postgres:5432/onbrand?schema=public
BASE_URL=http://localhost:8080
OAUTH_ISSUER=http://localhost:3000
OAUTH_AUTHORIZATION_ENDPOINT=http://localhost:3000/oauth/authorize
OAUTH_TOKEN_ENDPOINT=http://localhost:3000/oauth/token
OAUTH_BACKCHANNEL_TOKEN_ENDPOINT=http://host.docker.internal:3000/oauth/token
OAUTH_REGISTRATION_ENDPOINT=http://localhost:3000/oauth/register
OAUTH_JWKS_URL=http://host.docker.internal:3000/oauth/jwks.json
OAUTH_DASHBOARD_CLIENT_ID=onbrand-dashboard
OAUTH_REQUIRED_READ_SCOPE=onbrand:read
OAUTH_REQUIRED_WRITE_SCOPE=onbrand:write
OAUTH_OWNER_ID_CLAIM=sub
ASSET_DOWNLOAD_EXPIRES_IN_SECONDS=900
AWS_S3_BUCKET_BRAND_KIT_ASSETS=onbrand-brand-kit-assets
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your-real-access-key
AWS_SECRET_ACCESS_KEY=your-real-secret-key
```

The public endpoint variables are explicit so browser redirects and OAuth metadata can use
`localhost`, while server-to-server token and JWKS calls from the OnBrand container can use
`host.docker.internal`. `OAUTH_BACKCHANNEL_TOKEN_ENDPOINT` defaults to `OAUTH_TOKEN_ENDPOINT`, so
set it only when the OnBrand server needs a different network route. The token issuer remains
`http://localhost:3000`.

Connect Codex:

```sh
codex mcp add onbrand --url http://localhost:8080/mcp
codex mcp login onbrand
```

## Prod

Deploy the OnBrand container behind HTTPS, for example:

```txt
https://onbrand-mcp.slidespeak.co
```

Required prod `.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/onbrand?schema=public
BASE_URL=https://onbrand-mcp.slidespeak.co
OAUTH_ISSUER=https://app.slidespeak.co
OAUTH_AUTHORIZATION_ENDPOINT=https://app.slidespeak.co/oauth/authorize
OAUTH_TOKEN_ENDPOINT=https://app.slidespeak.co/oauth/token
# Optional; defaults to OAUTH_TOKEN_ENDPOINT unless the server needs a private network route.
OAUTH_BACKCHANNEL_TOKEN_ENDPOINT=https://app.slidespeak.co/oauth/token
OAUTH_REGISTRATION_ENDPOINT=https://app.slidespeak.co/oauth/register
OAUTH_JWKS_URL=https://app.slidespeak.co/oauth/jwks.json
OAUTH_DASHBOARD_CLIENT_ID=onbrand-dashboard
OAUTH_REQUIRED_READ_SCOPE=onbrand:read
OAUTH_REQUIRED_WRITE_SCOPE=onbrand:write
OAUTH_OWNER_ID_CLAIM=sub
ASSET_DOWNLOAD_EXPIRES_IN_SECONDS=900
AWS_S3_BUCKET_BRAND_KIT_ASSETS=onbrand-brand-kit-assets
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your-real-access-key
AWS_SECRET_ACCESS_KEY=your-real-secret-key
```

`BASE_URL` must match the public MCP URL clients use. Tokens are accepted only when their
audience/resource is:

```txt
${BASE_URL}/mcp
```

The OnBrand container always listens on port `8080`; configure public ports with Docker Compose or
your reverse proxy.
