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
    expect(registry.getBrandKit("acme").brandKit.colors).toHaveLength(6);
    expect(registry.getBrandKit("globex").brandKit.colors).toHaveLength(6);
  });
});
