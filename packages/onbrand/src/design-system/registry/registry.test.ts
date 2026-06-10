import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
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
  },
  ...overrides,
});

describe("Design System Registry", () => {
  test("lists Design System summaries without Brand Kit details", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem() });
    const registry = await loadDesignSystemRegistry({ rootDir });

    expect(registry.listDesignSystems()).toEqual([
      { id: "acme", name: "Acme Design System", description: "Example Design System." },
    ]);
  });

  test("fetches a Brand Kit by Design System id and preserves Color Token order", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem() });
    const registry = await loadDesignSystemRegistry({ rootDir });

    expect(registry.getBrandKit("acme")).toEqual({
      designSystem: {
        id: "acme",
        name: "Acme Design System",
        description: "Example Design System.",
      },
      brandKit: {
        colors: [
          {
            id: "primary",
            name: "Primary",
            value: "#123ABC",
            description: "Use for primary emphasis.",
          },
          {
            id: "neutral-900",
            name: "Neutral 900",
            value: "#111827",
            description: "Use for text.",
          },
        ],
      },
    });
  });

  test("throws a typed error for unknown Design System ids", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem() });
    const registry = await loadDesignSystemRegistry({ rootDir });

    expect(() => registry.getBrandKit("globex")).toThrow(UnknownDesignSystemError);
  });

  test("rejects unknown fields", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem({ extra: true }) });
    await expect(loadDesignSystemRegistry({ rootDir })).rejects.toThrow(/Invalid Design System/);
  });

  test("rejects unsupported schema versions", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem({ schemaVersion: 2 }) });
    await expect(loadDesignSystemRegistry({ rootDir })).rejects.toThrow(/Invalid Design System/);
  });

  test("rejects folder and Design System id mismatches", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem({ id: "globex" }) });
    await expect(loadDesignSystemRegistry({ rootDir })).rejects.toThrow(/does not match/);
  });

  test("rejects duplicate Color Token ids within a Brand Kit", async () => {
    const rootDir = await designSystemsRoot({
      acme: validDesignSystem({
        brandKit: {
          colors: [
            {
              id: "primary",
              name: "Primary",
              value: "#123ABC",
              description: "Use for primary emphasis.",
            },
            {
              id: "primary",
              name: "Primary Again",
              value: "#111827",
              description: "Duplicate id.",
            },
          ],
        },
      }),
    });

    await expect(loadDesignSystemRegistry({ rootDir })).rejects.toThrow(/Duplicate Color Token id/);
  });

  test("rejects lowercase hex values and missing Color Token descriptions", async () => {
    const lowerHexRoot = await designSystemsRoot({
      acme: validDesignSystem({
        brandKit: {
          colors: [
            { id: "primary", name: "Primary", value: "#123abc", description: "Bad casing." },
          ],
        },
      }),
    });
    await expect(loadDesignSystemRegistry({ rootDir: lowerHexRoot })).rejects.toThrow(
      /Invalid Design System/,
    );

    const missingDescriptionRoot = await designSystemsRoot({
      acme: validDesignSystem({
        brandKit: { colors: [{ id: "primary", name: "Primary", value: "#123ABC" }] },
      }),
    });
    await expect(loadDesignSystemRegistry({ rootDir: missingDescriptionRoot })).rejects.toThrow(
      /Invalid Design System/,
    );
  });

  test("returns immutable loaded data", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem() });
    const registry = await loadDesignSystemRegistry({ rootDir });
    const result = registry.getBrandKit("acme");

    expect(Object.isFrozen(result.brandKit.colors)).toBe(true);
    expect(Object.isFrozen(result.brandKit.colors[0])).toBe(true);
  });
});

const designSystemsRoot = async (systems: Record<string, unknown>): Promise<string> => {
  const root = await mkdtemp(path.join(os.tmpdir(), "onbrand-registry-"));
  for (const [folder, document] of Object.entries(systems)) {
    const dir = path.join(root, folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "design-system.json"), JSON.stringify(document, null, 2));
  }
  return root;
};
