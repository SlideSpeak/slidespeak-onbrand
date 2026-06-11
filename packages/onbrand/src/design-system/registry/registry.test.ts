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

describe("Design System Registry", () => {
  test("lists Design System summaries without Brand Kit or Presentation Kit details", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem() });
    const registry = await loadDesignSystemRegistry({ rootDir });

    expect(registry.listDesignSystems()).toEqual([
      { id: "acme", name: "Acme Design System", description: "Example Design System." },
    ]);
  });

  test("fetches a full Design System by id", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem() });
    const registry = await loadDesignSystemRegistry({ rootDir });

    const result = registry.getDesignSystem("acme");

    expect(result.designSystem).toMatchObject({ id: "acme", name: "Acme Design System" });
    expect(result.brandKit).toBeDefined();
    expect(result.presentationKit).toBeDefined();
  });

  test("throws a typed error for unknown Design System ids", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem() });
    const registry = await loadDesignSystemRegistry({ rootDir });

    expect(() => registry.getDesignSystem("globex")).toThrow(UnknownDesignSystemError);
  });

  test("rejects invalid Design System files and folder/id mismatches", async () => {
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

  test("returns immutable loaded data", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem() });
    const registry = await loadDesignSystemRegistry({ rootDir });
    const result = registry.getDesignSystem("acme");

    expect(Object.isFrozen(result.brandKit.colors)).toBe(true);
    expect(Object.isFrozen(result.brandKit.colors[0])).toBe(true);
    expect(Object.isFrozen(result.presentationKit.canvas)).toBe(true);
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
