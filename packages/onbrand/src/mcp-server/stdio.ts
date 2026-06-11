import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadDesignSystemRegistry } from "../design-system/registry/registry";
import { exampleDesignSystemsRoot } from "../package-root/paths";
import { createOnbrandMcpServer } from "./server";

const main = async (): Promise<void> => {
  const registry = await loadDesignSystemRegistry({
    rootDir: exampleDesignSystemsRoot(import.meta.url),
  });
  const server = createOnbrandMcpServer(registry);
  await server.connect(new StdioServerTransport());
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exit(1);
});
