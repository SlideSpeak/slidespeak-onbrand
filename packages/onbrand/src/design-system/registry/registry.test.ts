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
    persistentElements: [
      {
        id: "brand-logo",
        name: "Brand Logo",
        description: "Required recurring logo.",
        kind: "logo",
        usagePolicy: "required",
        placement: { x: 80, y: 980, width: 160, height: 48 },
      },
      {
        id: "slide-number",
        name: "Slide Number",
        description: "Required recurring slide number.",
        kind: "slideNumber",
        usagePolicy: "required",
        placement: { x: 1760, y: 1010, width: 80, height: 32 },
        textStyle: { fontSize: 12, fontWeight: 400, colorTokenId: "neutral-900" },
      },
      {
        id: "accent-corner",
        name: "Accent Corner",
        description: "Optional accent shape.",
        kind: "shape",
        usagePolicy: "optional",
        shape: "rectangle",
        placement: { x: -80, y: -80, width: 240, height: 240 },
        shapeStyle: { fillColorTokenId: "primary" },
      },
    ],
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

    const designSystem = registry.getDesignSystem("acme");
    expect(designSystem.designSystem).toEqual({
      id: "acme",
      name: "Acme Design System",
      description: "Example Design System.",
    });
    expect(designSystem.brandKit.logo).toEqual({
      name: "Primary Logo",
      source: "./assets/logo.svg",
      description: "Use on light backgrounds.",
    });
    expect(designSystem.brandKit.colors).toHaveLength(2);
    expect(designSystem.presentationKit.canvas).toEqual({ width: 1920, height: 1080, unit: "px" });
    expect(designSystem.presentationKit.persistentElements).toHaveLength(3);
  });

  test("throws a typed error for unknown Design System ids", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem() });
    const registry = await loadDesignSystemRegistry({ rootDir });

    expect(() => registry.getDesignSystem("globex")).toThrow(UnknownDesignSystemError);
  });

  test("rejects unknown fields, unsupported schema versions, and folder/id mismatches", async () => {
    await expect(
      loadDesignSystemRegistry({
        rootDir: await designSystemsRoot({ acme: validDesignSystem({ extra: true }) }),
      }),
    ).rejects.toThrow(/Invalid Design System/);
    await expect(
      loadDesignSystemRegistry({
        rootDir: await designSystemsRoot({ acme: validDesignSystem({ schemaVersion: 2 }) }),
      }),
    ).rejects.toThrow(/Invalid Design System/);
    await expect(
      loadDesignSystemRegistry({
        rootDir: await designSystemsRoot({ acme: validDesignSystem({ id: "globex" }) }),
      }),
    ).rejects.toThrow(/does not match/);
  });

  test("rejects duplicate ids within Brand Kit colors and Presentation Kit Persistent Layout Elements", async () => {
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

    await expect(
      loadDesignSystemRegistry({
        rootDir: await designSystemsRoot({
          acme: validDesignSystem({
            presentationKit: {
              ...validDesignSystem().presentationKit,
              persistentElements: [
                validDesignSystem().presentationKit.persistentElements[0],
                {
                  ...validDesignSystem().presentationKit.persistentElements[0],
                  name: "Brand Logo Again",
                },
              ],
            },
          }),
        }),
      }),
    ).rejects.toThrow(/Duplicate Persistent Layout Element id/);
  });

  test("rejects invalid Presentation Kit Color Token references", async () => {
    await expect(
      loadDesignSystemRegistry({
        rootDir: await designSystemsRoot({
          acme: validDesignSystem({
            presentationKit: {
              ...validDesignSystem().presentationKit,
              persistentElements: [
                {
                  ...validDesignSystem().presentationKit.persistentElements[1],
                  textStyle: { fontSize: 12, fontWeight: 400, colorTokenId: "missing" },
                },
              ],
            },
          }),
        }),
      }),
    ).rejects.toThrow(/Unknown Color Token id/);
  });

  test("accepts placement bleed but rejects non-positive sizes and non-integer numbers", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem() });
    await expect(loadDesignSystemRegistry({ rootDir })).resolves.toBeDefined();

    await expect(
      loadDesignSystemRegistry({
        rootDir: await designSystemsRoot({
          acme: validDesignSystem({
            presentationKit: {
              ...validDesignSystem().presentationKit,
              persistentElements: [
                {
                  ...validDesignSystem().presentationKit.persistentElements[0],
                  placement: { x: 0, y: 0, width: 0, height: 10 },
                },
              ],
            },
          }),
        }),
      }),
    ).rejects.toThrow(/Invalid Design System/);

    await expect(
      loadDesignSystemRegistry({
        rootDir: await designSystemsRoot({
          acme: validDesignSystem({
            presentationKit: {
              ...validDesignSystem().presentationKit,
              canvas: { width: 1920.5, height: 1080, unit: "px" },
            },
          }),
        }),
      }),
    ).rejects.toThrow(/Invalid Design System/);
  });

  test("returns immutable loaded data", async () => {
    const rootDir = await designSystemsRoot({ acme: validDesignSystem() });
    const registry = await loadDesignSystemRegistry({ rootDir });
    const result = registry.getDesignSystem("acme");

    expect(Object.isFrozen(result.brandKit.colors)).toBe(true);
    expect(Object.isFrozen(result.brandKit.colors[0])).toBe(true);
    expect(Object.isFrozen(result.presentationKit.persistentElements)).toBe(true);
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
