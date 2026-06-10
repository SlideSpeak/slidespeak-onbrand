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
    ).toEqual(["mckinsey"]);
    expect(registry.getDesignSystem("mckinsey").brandKit.colors).toHaveLength(12);
    expect(registry.getDesignSystem("mckinsey").brandKit.logo.source).toMatch(
      /examples\/design-systems\/mckinsey\/assets\/logo\.svg$/,
    );
    expect(
      registry.getDesignSystem("mckinsey").brandKit.assets.map(({ id, source, mediaType }) => ({
        id,
        source: source.replace(/^.*examples\/design-systems\/mckinsey\//, ""),
        mediaType,
      })),
    ).toEqual([
      { id: "logo", source: "assets/logo.svg", mediaType: "image/svg+xml" },
      { id: "loop-pattern", source: "assets/bg.svg", mediaType: "image/svg+xml" },
    ]);
    expect(registry.getDesignSystem("mckinsey").brandKit.designPrompt).toContain(
      "McKinsey-Style Presentation",
    );
    expect(registry.getDesignSystem("mckinsey").presentationKit.canvas).toEqual({
      width: 1280,
      height: 720,
      unit: "px",
    });
  });

  test("shipped example relative asset sources exist", async () => {
    const rootDir = exampleDesignSystemsRoot(import.meta.url);
    const registry = await loadDesignSystemRegistry({ rootDir });

    await Promise.all(
      registry.listDesignSystems().flatMap((system) => {
        const brandKit = registry.getDesignSystem(system.id).brandKit;
        return [brandKit.logo, ...brandKit.assets]
          .filter((asset) => asset.source.startsWith("./"))
          .map((asset) => access(path.join(rootDir, system.id, asset.source)));
      }),
    );
  });
});
