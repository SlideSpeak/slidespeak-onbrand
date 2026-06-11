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
    ).toEqual(["skyleague"]);
    expect(registry.getDesignSystem("skyleague").brandKit.colors).toHaveLength(10);
    expect(registry.getDesignSystem("skyleague").brandKit.logo.source).toMatch(
      /examples\/design-systems\/skyleague\/assets\/logo\.svg$/,
    );
    expect(
      registry.getDesignSystem("skyleague").brandKit.assets.map(({ id, source, mediaType }) => ({
        id,
        source: source.replace(/^.*examples\/design-systems\/skyleague\//, ""),
        mediaType,
      })),
    ).toEqual([
      { id: "logo", source: "assets/logo.svg", mediaType: "image/svg+xml" },
      { id: "hero-orb", source: "assets/hero.png", mediaType: "image/png" },
      { id: "circle", source: "assets/circle.svg", mediaType: "image/svg+xml" },
      { id: "icon-1", source: "assets/icon-1.svg", mediaType: "image/svg+xml" },
      { id: "icon-2", source: "assets/icon-2.svg", mediaType: "image/svg+xml" },
    ]);
    expect(registry.getDesignSystem("skyleague").brandKit.designPrompt).toContain(
      "SKYLEAGUE Presentation",
    );
    expect(registry.getDesignSystem("skyleague").presentationKit.canvas).toEqual({
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
