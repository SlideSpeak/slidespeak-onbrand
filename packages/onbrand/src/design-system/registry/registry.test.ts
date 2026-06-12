import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { loadDesignSystemRegistry, UnknownDesignSystemError } from "./registry";

const validDesignSystem = (overrides: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  id: "acme",
  name: "Acme Design System",
  description: "Example Design System.",
  brandKit: {
    colors: [
      {
        id: "primary",
        name: "Primary",
        value: "#123ABC",
        description: "Use for primary emphasis.",
      },
      { id: "neutral-900", name: "Neutral 900", value: "#111827", description: "Use for text." },
    ],
    logo: {
      name: "Primary Logo",
      source: "./assets/logo.svg",
      description: "Use on light backgrounds.",
    },
  },
  presentationKit: {
    canvas: { width: 1920, height: 1080, unit: "px" },
  },
  ...overrides,
});

const DEFAULT_FILES = {
  "assets/logo.svg": "<svg><title>Logo</title></svg>",
  "assets/wave-divider.svg": '<svg><path d="M0 0" /></svg>',
  "assets/texture.png": Buffer.from([0x89, 0x50, 0x4e, 0x47]),
};

describe("Design System Registry", () => {
  test("lists Design System summaries without Brand Kit or Presentation Kit details", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem() });
    const registry = await loadDesignSystemRegistry({ rootDir });

    expect(registry.listDesignSystems()).toEqual([
      { id: "acme", name: "Acme Design System", description: "Example Design System." },
    ]);
  });

  test("returns MCP-facing Design Systems with Brand Kit asset metadata and no source paths", async () => {
    const rootDir = await designSystemsRoot({
      acme: validDesignSystem({
        brandKit: {
          ...validDesignSystem().brandKit,
          decorativeAssets: [
            {
              id: "wave-divider",
              name: "Wave Divider",
              source: "assets/wave-divider.svg",
              description: "Use as a subtle section divider.",
            },
          ],
        },
      }),
    });
    const registry = await loadDesignSystemRegistry({ rootDir });

    const result = registry.getDesignSystem("acme");

    expect(result).toEqual({
      designSystem: {
        id: "acme",
        name: "Acme Design System",
        description: "Example Design System.",
      },
      brandKit: {
        colors: validDesignSystem().brandKit.colors,
        logo: {
          name: "Primary Logo",
          assetHandle: "LOGO",
          filename: "logo.svg",
          mimeType: "image/svg+xml",
          description: "Use on light backgrounds.",
        },
        decorativeAssets: [
          {
            id: "wave-divider",
            name: "Wave Divider",
            assetHandle: "DECORATIVE_ASSET_WAVE_DIVIDER",
            filename: "wave-divider.svg",
            mimeType: "image/svg+xml",
            description: "Use as a subtle section divider.",
          },
        ],
      },
      presentationKit: {
        canvas: { width: 1920, height: 1080, unit: "px" },
      },
    });
    expect(keysDeep(result)).not.toContain("source");
    expect(keysDeep(result)).not.toContain("resourceUri");
  });

  test("normalizes omitted Decorative Assets to an empty MCP-facing array", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem() });
    const registry = await loadDesignSystemRegistry({ rootDir });

    expect(registry.getDesignSystem("acme").brandKit.decorativeAssets).toEqual([]);
  });

  test("throws a typed error for unknown Design System ids", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem() });
    const registry = await loadDesignSystemRegistry({ rootDir });

    expect(() => registry.getDesignSystem("globex")).toThrow(UnknownDesignSystemError);
  });

  test("rejects invalid Design System documents and folder/id mismatches", async () => {
    const invalidJsonRoot = await mkdtemp(path.join(os.tmpdir(), "onbrand-registry-"));
    await mkdir(path.join(invalidJsonRoot, "acme"), { recursive: true });
    await writeFile(path.join(invalidJsonRoot, "acme", "design-system.json"), "{");

    await expect(loadDesignSystemRegistry({ rootDir: invalidJsonRoot })).rejects.toThrow(
      /Invalid JSON/,
    );
    await expect(
      loadDesignSystemRegistry({
        rootDir: await designSystemsRoot({ acme: validDesignSystem({ extra: true }) }),
      }),
    ).rejects.toThrow(/Invalid Design System/);
    await expect(
      loadDesignSystemRegistry({
        rootDir: await designSystemsRoot({ acme: validDesignSystem({ id: "globex" }) }),
      }),
    ).rejects.toThrow(/does not match/);
  });

  test("rejects duplicate ids within Brand Kit colors", async () => {
    await expect(
      loadDesignSystemRegistry({
        rootDir: await designSystemsRoot({
          acme: validDesignSystem({
            brandKit: {
              ...validDesignSystem().brandKit,
              colors: [
                { id: "primary", name: "Primary", value: "#123ABC", description: "One." },
                { id: "primary", name: "Primary Again", value: "#111827", description: "Two." },
              ],
            },
          }),
        }),
      }),
    ).rejects.toThrow(/Duplicate Color Token id/);
  });

  test("materializes declared Brand Kit assets through the registry interface", async () => {
    const rootDir = await designSystemsRoot({ acme: designSystemWithTextureAsset() });
    const registry = await loadDesignSystemRegistry({ rootDir });
    const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "onbrand-materialized-assets-"));

    const result = await registry.materializeBrandKitAssets({
      designSystemId: "acme",
      outputDirectory,
      assetHandles: ["DECORATIVE_ASSET_TEXTURE"],
    });

    expect(result).toEqual({
      designSystemId: "acme",
      outputDirectory,
      assets: [
        {
          kind: "DECORATIVE_ASSET",
          id: "texture",
          assetHandle: "DECORATIVE_ASSET_TEXTURE",
          name: "Texture",
          filename: "texture.png",
          mimeType: "image/png",
          path: path.join(outputDirectory, "texture.png"),
        },
      ],
    });
    await expect(readFile(path.join(outputDirectory, "texture.png"))).resolves.toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    );
  });

  test("returns immutable loaded data", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem() });
    const registry = await loadDesignSystemRegistry({ rootDir });
    const result = registry.getDesignSystem("acme");

    expect(Object.isFrozen(result.brandKit.colors)).toBe(true);
    expect(Object.isFrozen(result.brandKit.colors[0])).toBe(true);
    expect(Object.isFrozen(result.presentationKit.canvas)).toBe(true);
  });
});

const designSystemWithTextureAsset = () =>
  validDesignSystem({
    brandKit: {
      ...validDesignSystem().brandKit,
      decorativeAssets: [
        {
          id: "texture",
          name: "Texture",
          source: "assets/texture.png",
          description: "Use behind title content.",
        },
      ],
    },
  });

const keysDeep = (value: unknown): string[] => {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) => [key, ...keysDeep(nested)]);
};

const designSystemsRoot = async (
  systems: Record<string, unknown>,
  files: Record<string, string | Buffer> = DEFAULT_FILES,
): Promise<string> => {
  const root = await mkdtemp(path.join(os.tmpdir(), "onbrand-registry-"));
  for (const [folder, document] of Object.entries(systems)) {
    const dir = path.join(root, folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "design-system.json"), JSON.stringify(document, null, 2));
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(dir, filePath);
      await mkdir(path.dirname(fullPath), { recursive: true });
      await writeFile(fullPath, content);
    }
  }
  return root;
};
