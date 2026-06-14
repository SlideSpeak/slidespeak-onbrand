FROM oven/bun:1.3.12-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/env/package.json packages/env/package.json
COPY packages/file/package.json packages/file/package.json
COPY packages/number/package.json packages/number/package.json
COPY packages/string/package.json packages/string/package.json
COPY packages/s3/package.json packages/s3/package.json
COPY packages/onbrand/package.json packages/onbrand/package.json

RUN bun install --frozen-lockfile

COPY . .

RUN bunx prisma generate

EXPOSE 8080

CMD ["sh", "-c", "bunx prisma migrate deploy && bun packages/onbrand/src/mcp-server/http.ts"]
