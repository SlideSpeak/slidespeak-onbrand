import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const readMarkdownAsString = (importMetaUrl: string, relativePath: string): string =>
  readFileSync(join(dirname(fileURLToPath(importMetaUrl)), relativePath), "utf8").trim();
