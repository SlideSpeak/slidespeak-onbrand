import { describe, expect, test } from "vitest";
import { type DesignSystem } from "../design-system";
import { checkPresentationConformance } from "./conformance";

const designSystem: DesignSystem = {
  schemaVersion: 1,
  id: "acme",
  name: "Acme Design System",
  description: "Example.",
  brandKit: {
    colors: [
      { id: "primary", name: "Primary", value: "#123ABC", description: "Primary." },
      { id: "neutral-900", name: "Neutral 900", value: "#111827", description: "Text." },
    ],
    logo: { name: "Primary Logo", source: "./logo.svg", description: "Logo." },
  },
  presentationKit: {
    canvas: { width: 1920, height: 1080, unit: "px" },
    persistentElements: [
      {
        id: "brand-logo",
        name: "Brand Logo",
        description: "Required logo.",
        kind: "logo",
        usagePolicy: "required",
        placement: { x: 80, y: 980, width: 160, height: 48 },
      },
      {
        id: "slide-number",
        name: "Slide Number",
        description: "Required slide number.",
        kind: "slideNumber",
        usagePolicy: "required",
        placement: { x: 1760, y: 1010, width: 80, height: 32 },
        textStyle: { fontSize: 12, fontWeight: 400, colorTokenId: "neutral-900" },
      },
      {
        id: "confidential-footer",
        name: "Confidential Footer",
        description: "Optional fixed footer.",
        kind: "text",
        usagePolicy: "optional",
        text: "Confidential",
        placement: { x: 80, y: 1010, width: 240, height: 32 },
        textStyle: { fontSize: 12, fontWeight: 600, colorTokenId: "neutral-900" },
      },
      {
        id: "accent-corner",
        name: "Accent Corner",
        description: "Optional accent shape.",
        kind: "shape",
        usagePolicy: "optional",
        shape: "ellipse",
        placement: { x: -80, y: -80, width: 240, height: 240 },
        shapeStyle: { fillColorTokenId: "primary" },
      },
    ],
  },
};

const requiredUses = [
  {
    persistentElementId: "brand-logo",
    placement: { x: 80, y: 980, width: 160, height: 48 },
  },
  {
    persistentElementId: "slide-number",
    placement: { x: 1760, y: 1010, width: 80, height: 32 },
    textStyle: { fontSize: 12, fontWeight: 400, colorTokenId: "neutral-900" },
  },
];

describe("Presentation Conformance Check", () => {
  test("passes when every slide declares required Persistent Layout Elements exactly", () => {
    expect(
      checkPresentationConformance({
        designSystem,
        manifest: {
          designSystemId: "acme",
          slides: [
            { slideId: "slide-1", persistentElementUses: requiredUses },
            { slideId: "slide-2", persistentElementUses: requiredUses },
          ],
        },
      }),
    ).toEqual({ passes: true, errors: [] });
  });

  test("passes when optional elements are absent and checks them exactly when present", () => {
    expect(
      checkPresentationConformance({
        designSystem,
        manifest: {
          designSystemId: "acme",
          slides: [{ slideId: "slide-1", persistentElementUses: requiredUses }],
        },
      }).passes,
    ).toBe(true);

    expect(
      checkPresentationConformance({
        designSystem,
        manifest: {
          designSystemId: "acme",
          slides: [
            {
              slideId: "slide-1",
              persistentElementUses: [
                ...requiredUses,
                {
                  persistentElementId: "confidential-footer",
                  text: "Confidential",
                  placement: { x: 80, y: 1010, width: 240, height: 32 },
                  textStyle: { fontSize: 12, fontWeight: 600, colorTokenId: "neutral-900" },
                },
                {
                  persistentElementId: "accent-corner",
                  shape: "ellipse",
                  placement: { x: -80, y: -80, width: 240, height: 240 },
                  shapeStyle: { fillColorTokenId: "primary" },
                },
              ],
            },
          ],
        },
      }).passes,
    ).toBe(true);
  });

  test("fails with structured errors for missing, duplicate, and unknown Persistent Layout Elements", () => {
    const result = checkPresentationConformance({
      designSystem,
      manifest: {
        designSystemId: "acme",
        slides: [
          {
            slideId: "slide-1",
            persistentElementUses: [
              requiredUses[0],
              requiredUses[0],
              { persistentElementId: "made-up", placement: { x: 0, y: 0, width: 1, height: 1 } },
            ],
          },
        ],
      },
    });

    expect(result.passes).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "DUPLICATE_PERSISTENT_ELEMENT_USE",
          slideId: "slide-1",
          persistentElementId: "brand-logo",
          path: ["slides", 0, "persistentElementUses", 1, "persistentElementId"],
        }),
        expect.objectContaining({
          code: "UNKNOWN_PERSISTENT_ELEMENT",
          slideId: "slide-1",
          persistentElementId: "made-up",
          path: ["slides", 0, "persistentElementUses", 2, "persistentElementId"],
        }),
        expect.objectContaining({
          code: "MISSING_REQUIRED_PERSISTENT_ELEMENT",
          slideId: "slide-1",
          persistentElementId: "slide-number",
          path: ["slides", 0, "persistentElementUses"],
        }),
      ]),
    );
  });

  test("fails when any checked field differs exactly", () => {
    const mismatches = [
      { ...requiredUses[0], placement: { x: 81, y: 980, width: 160, height: 48 } },
      {
        ...requiredUses[1],
        textStyle: { fontSize: 13, fontWeight: 400, colorTokenId: "neutral-900" },
      },
      {
        persistentElementId: "confidential-footer",
        text: "Internal",
        placement: { x: 80, y: 1010, width: 240, height: 32 },
        textStyle: { fontSize: 12, fontWeight: 600, colorTokenId: "neutral-900" },
      },
      {
        persistentElementId: "accent-corner",
        shape: "rectangle",
        placement: { x: -80, y: -80, width: 240, height: 240 },
        shapeStyle: { fillColorTokenId: "primary" },
      },
    ];

    for (const mismatch of mismatches) {
      const result = checkPresentationConformance({
        designSystem,
        manifest: {
          designSystemId: "acme",
          slides: [{ slideId: "slide-1", persistentElementUses: [...requiredUses, mismatch] }],
        },
      });

      expect(result.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: "PERSISTENT_ELEMENT_MISMATCH" })]),
      );
    }
  });

  test("fails invalid manifests and Design System id mismatches", () => {
    expect(
      checkPresentationConformance({
        designSystem,
        manifest: { designSystemId: "globex", slides: [] },
      }).errors,
    ).toEqual([
      expect.objectContaining({ code: "DESIGN_SYSTEM_MISMATCH", path: ["designSystemId"] }),
    ]);

    expect(
      checkPresentationConformance({ designSystem, manifest: { designSystemId: "acme" } }).errors,
    ).toEqual([expect.objectContaining({ code: "INVALID_CONFORMANCE_MANIFEST", path: [] })]);
  });
});
