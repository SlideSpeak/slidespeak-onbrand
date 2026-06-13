import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export const createPrismaClient = (): PrismaClient =>
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString:
        process.env.DATABASE_URL ??
        "postgresql://onbrand:onbrand@localhost:5433/onbrand?schema=public",
    }),
  });
