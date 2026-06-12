import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { localDevelopmentAuthContext } from "../auth/context";
import { createPrismaClient } from "../database/prisma-client";
import { PrismaDesignSystemRegistry } from "../design-system/registry/prisma-registry";
import { createOnbrandMcpServer } from "./server";

const main = async (): Promise<void> => {
  const prisma = createPrismaClient();
  const server = createOnbrandMcpServer(
    new PrismaDesignSystemRegistry(prisma),
    localDevelopmentAuthContext(),
  );
  await server.connect(new StdioServerTransport());
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exit(1);
});
