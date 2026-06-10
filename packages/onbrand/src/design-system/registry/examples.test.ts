import { access } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { exampleDesignSystemsRoot } from "../../package-root/paths";
import { loadDesignSystemRegistry } from "./registry";

describe("example Design Systems", () => {
  test("shipped examples are valid and discoverable", async () => {
    const registry = await loadDesignSystemRegistry({
      rootDir: exampleDesignSystemsRoot(import.meta.url),
    });

    expect(
      registry
        .listDesignSystems()
        .map((system) => system.id)
        .sort(),
    ).toEqual(["acme", "globex"]);
    expect(registry.getDesignSystem("acme").brandKit.colors).toHaveLength(6);
    expect(registry.getDesignSystem("globex").brandKit.colors).toHaveLength(6);
    expect(registry.getDesignSystem("acme").brandKit.logo.source).toBe("./assets/logo-primary.svg");
    expect(registry.getDesignSystem("globex").presentationKit.persistentElements).toHaveLength(3);
  });

  test("shipped example logo relative sources exist", async () => {
    const rootDir = exampleDesignSystemsRoot(import.meta.url);
    const registry = await loadDesignSystemRegistry({ rootDir });

    await Promise.all(
      registry
        .listDesignSystems()
        .map((system) => ({ system, logo: registry.getDesignSystem(system.id).brandKit.logo }))
        .filter(({ logo }) => logo.source.startsWith("./"))
        .map(({ system, logo }) => access(path.join(rootDir, system.id, logo.source))),
    );
  });
});
