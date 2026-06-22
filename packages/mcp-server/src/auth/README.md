# OnBrand OAuth And Runtime Configuration

OnBrand by SlideSpeak is currently supported for local and development deployments. It is designed
to run as a standalone MCP service when paired with a compatible OAuth provider, Postgres, and S3.
The examples below are generic and are not tied to SlideSpeak production infrastructure.

## OAuth Provider Contract

OnBrand accepts JWT access tokens from any OAuth provider that can satisfy this contract:

- The token `iss` matches `OAUTH_ISSUER`.
- The token audience includes the derived MCP resource, `${BASE_URL}/mcp`.
- The token has an expiration time and verifies against `OAUTH_JWKS_URL`.
- The token includes an owner identifier in `OAUTH_OWNER_ID_CLAIM`, defaulting to `sub`.
- The token includes required scopes in the standard space-delimited `scope` claim.
- Read-only tools require `OAUTH_REQUIRED_READ_SCOPE`.
- Mutating tools require `OAUTH_REQUIRED_WRITE_SCOPE`.

OnBrand fails closed when issuer, audience, signature, expiry, owner identity, scopes, or JWKS
verification are invalid.

The MCP resource URL and dashboard callback URL are derived from `BASE_URL`:

```txt
${BASE_URL}/mcp
${BASE_URL}/oauth/callback
```

## Local Development

Copy the example file and fill in real local values:

```sh
cp .env.example .env
```

Then start the containers:

```sh
docker compose up --build
```

The default example assumes the OAuth provider is reachable from a browser at `localhost:3000`,
while server-to-server token and JWKS calls from the container use `host.docker.internal`.

Local endpoints:

```txt
http://localhost:8080/health
http://localhost:8080/mcp
http://localhost:8080/dashboard
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

## Required Environment

| Variable                         | Required | Default                                                                            | Notes                                                              |
| -------------------------------- | -------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`                   | Yes      | `postgresql://onbrand:onbrand@localhost:5433/onbrand?schema=public` outside Docker | Use the Docker host `postgres` when running with `docker compose`. |
| `BASE_URL`                       | Yes      | `http://localhost:8080`                                                            | Public origin. The MCP resource is `${BASE_URL}/mcp`.              |
| `OAUTH_ISSUER`                   | Yes      | None                                                                               | Expected access-token issuer.                                      |
| `OAUTH_AUTHORIZATION_ENDPOINT`   | Yes      | None                                                                               | Browser authorization URL.                                         |
| `OAUTH_TOKEN_ENDPOINT`           | Yes      | None                                                                               | Token exchange URL.                                                |
| `OAUTH_JWKS_URL`                 | Yes      | None                                                                               | JWKS URL used for token verification.                              |
| `OAUTH_DASHBOARD_CLIENT_ID`      | Yes      | None                                                                               | Static OAuth client ID for the bundled dashboard.                  |
| `DASHBOARD_SESSION_SECRET`       | Yes      | None                                                                               | Long random value used to sign dashboard cookies.                  |
| `AWS_S3_BUCKET_BRAND_KIT_ASSETS` | Yes      | None                                                                               | S3 bucket that stores uploaded Brand Kit assets.                   |
| `AWS_REGION`                     | Yes      | `us-east-1`                                                                        | AWS region for the S3 client.                                      |
| `AWS_ACCESS_KEY_ID`              | Yes      | None                                                                               | AWS credential with Brand Kit asset bucket access.                 |
| `AWS_SECRET_ACCESS_KEY`          | Yes      | None                                                                               | Matching AWS secret credential.                                    |

Optional variables:

| Variable                            | Default                | Notes                                                                |
| ----------------------------------- | ---------------------- | -------------------------------------------------------------------- |
| `OAUTH_REGISTRATION_ENDPOINT`       | None                   | Advertised when your provider supports dynamic client registration.  |
| `OAUTH_BACKCHANNEL_TOKEN_ENDPOINT`  | `OAUTH_TOKEN_ENDPOINT` | Private server route for token exchanges, for example from Docker.   |
| `OAUTH_REQUIRED_READ_SCOPE`         | `onbrand:read`         | Scope required by read-only MCP tools.                               |
| `OAUTH_REQUIRED_WRITE_SCOPE`        | `onbrand:write`        | Scope required by mutating MCP tools.                                |
| `OAUTH_OWNER_ID_CLAIM`              | `sub`                  | Claim that maps OAuth identities to OnBrand owners.                  |
| `ASSET_DOWNLOAD_EXPIRES_IN_SECONDS` | `900`                  | Lifetime for presigned asset download URLs.                          |
| `DASHBOARD_DEV_SERVER_URL`          | None                   | Used by local Docker Compose to proxy the Vite dashboard dev server. |

## Generic Local `.env`

The checked-in `.env.example` intentionally uses development placeholders and example bucket names.
Keep real credentials in ignored local files or your deployment secret store.

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

DASHBOARD_SESSION_SECRET=replace-with-a-long-random-local-secret
ASSET_DOWNLOAD_EXPIRES_IN_SECONDS=900
AWS_S3_BUCKET_BRAND_KIT_ASSETS=onbrand-dev-brand-kit-assets
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=replace-with-aws-access-key-id
AWS_SECRET_ACCESS_KEY=replace-with-aws-secret-access-key
```

## Dashboard Session Secret

`DASHBOARD_SESSION_SECRET` signs dashboard session and refresh cookies. For production-like
deployments, generate a long random value and keep it stable across restarts:

```sh
openssl rand -hex 32
```

Rotating this value invalidates existing dashboard sessions.

## S3 Setup Notes

OnBrand stores uploaded Brand Kit assets in S3 and gives MCP clients short-lived presigned upload
and download URLs. Use a dedicated development bucket, for example `onbrand-dev-brand-kit-assets`,
rather than a shared production bucket.

The AWS credential should be scoped to the bucket used by `AWS_S3_BUCKET_BRAND_KIT_ASSETS`. It needs
permission to put, get, and delete objects in that bucket. Public bucket access is not required
because clients use presigned URLs.

## Production Checklist

Production support is still in development. Before exposing OnBrand to real users, verify at least:

- `BASE_URL` is an HTTPS origin controlled by your deployment.
- OAuth tokens are issued with audience/resource `${BASE_URL}/mcp`.
- `OAUTH_AUTHORIZATION_ENDPOINT`, `OAUTH_TOKEN_ENDPOINT`, and `OAUTH_JWKS_URL` are HTTPS URLs.
- `OAUTH_REGISTRATION_ENDPOINT` is set only if your provider supports dynamic client registration.
- `OAUTH_DASHBOARD_CLIENT_ID` is registered with callback `${BASE_URL}/oauth/callback`.
- `DASHBOARD_SESSION_SECRET` is generated with strong randomness and stored as a secret.
- `DATABASE_URL` points to a managed Postgres database with backups.
- `AWS_S3_BUCKET_BRAND_KIT_ASSETS` is a dedicated bucket with least-privilege credentials.
- The deployment runs database migrations before serving traffic.
- Reverse proxy and container ports expose only the intended OnBrand HTTP service.
- Logs and environment reports do not disclose secrets.

## Governance Status

For this public-readiness pass, `SECURITY.md`, `CONTRIBUTING.md`, GitHub issue and pull request
templates, and a Code of Conduct are intentionally out of scope. Contribution discussion should
start in GitHub Discussions or issues until those files exist.
