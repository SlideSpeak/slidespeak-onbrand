# OnBrand MCP OAuth

## Local

Run the SlideSpeak web app on `localhost:3000`, then start OnBrand from the repository root:

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
SLIDESPEAK_OAUTH_ISSUER=http://localhost:3000
SLIDESPEAK_JWKS_URL=http://host.docker.internal:3000/oauth/jwks.json
ASSET_DOWNLOAD_EXPIRES_IN_SECONDS=900
AWS_S3_BUCKET_BRAND_KIT_ASSETS=onbrand-brand-kit-assets
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your-real-access-key
AWS_SECRET_ACCESS_KEY=your-real-secret-key
```

`SLIDESPEAK_JWKS_URL` is only needed locally because the OnBrand container must reach the SlideSpeak
app running on the host machine. The token issuer remains `http://localhost:3000`.

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
SLIDESPEAK_OAUTH_ISSUER=https://app.slidespeak.co
ASSET_DOWNLOAD_EXPIRES_IN_SECONDS=900
AWS_S3_BUCKET_BRAND_KIT_ASSETS=onbrand-brand-kit-assets
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your-real-access-key
AWS_SECRET_ACCESS_KEY=your-real-secret-key
```

`SLIDESPEAK_JWKS_URL` is normally omitted in prod. OnBrand defaults it to:

```txt
${SLIDESPEAK_OAUTH_ISSUER}/oauth/jwks.json
```

`BASE_URL` must match the public MCP URL clients use. Tokens are accepted only when their
audience/resource is:

```txt
${BASE_URL}/mcp
```

The OnBrand container always listens on port `8080`; configure public ports with Docker Compose or
your reverse proxy.
