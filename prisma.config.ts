import { requiredString } from "@onbrand/env";
import { defineConfig } from "prisma/config";

const defaultDatabaseUrl = "postgresql://onbrand:onbrand@localhost:5433/onbrand?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: requiredString("DATABASE_URL", defaultDatabaseUrl).read(),
  },
});
