import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { resolveConfig } from "vite";

import dashboardViteConfig from "./vite.config";

const dashboardRoot = fileURLToPath(new URL(".", import.meta.url));
const dashboardSourceRoot = join(dashboardRoot, "src");
const sourceFileExtensions = new Set([".ts", ".tsx"]);
const serverOnlyDashboardRuntimePackages = ["@onbrand/s3"] as const;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const runtimeImportPattern = (packageName: string): RegExp => {
  const escapedPackageName = escapeRegExp(packageName);
  const packageSpecifier = `${escapedPackageName}(?:/[^"']*)?`;
  return new RegExp(
    [
      `import\\s+(?!type\\b)[\\s\\S]*?from\\s*["']${packageSpecifier}["']`,
      `export\\s+(?!type\\b)[\\s\\S]*?from\\s*["']${packageSpecifier}["']`,
      `import\\s*\\(\\s*["']${packageSpecifier}["']\\s*\\)`,
    ].join("|"),
  );
};

const dashboardSourceFiles = (directory: string): readonly string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return dashboardSourceFiles(path);
    if (entry.isFile() && sourceFileExtensions.has(extname(entry.name))) return [path];
    return [];
  });

describe("dashboard Vite browser boundaries", () => {
  it("does not alias server-only workspace packages into the browser resolver", async () => {
    const config = await resolveConfig(dashboardViteConfig, "build");
    const aliases = config.resolve.alias.map(({ find }) =>
      typeof find === "string" ? find : find.source,
    );

    expect(aliases).not.toEqual(expect.arrayContaining([...serverOnlyDashboardRuntimePackages]));
  });

  it("does not import server-only packages from dashboard runtime source", () => {
    const violations = dashboardSourceFiles(dashboardSourceRoot).flatMap((path) => {
      const source = readFileSync(path, "utf8");
      return serverOnlyDashboardRuntimePackages
        .filter((packageName) => runtimeImportPattern(packageName).test(source))
        .map((packageName) => `${path}: ${packageName}`);
    });

    expect(violations).toEqual([]);
  });
});
