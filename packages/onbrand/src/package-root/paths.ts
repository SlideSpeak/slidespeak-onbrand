import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const workspaceRootFromModule = (metaUrl: string): string => {
  let current = path.dirname(fileURLToPath(metaUrl));

  while (!existsSync(path.join(current, "examples", "design-systems"))) {
    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(`Could not find workspace root from ${metaUrl}`);
    }
    current = parent;
  }

  return current;
};

export const exampleDesignSystemsRoot = (metaUrl: string): string =>
  path.join(workspaceRootFromModule(metaUrl), "examples", "design-systems");
