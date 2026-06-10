import { z } from "zod";
import { designSystemIdSchema, type DesignSystem } from "../design-system";
import { placementSchema } from "../presentation-kit/presentation-kit";

const PERSISTENT_ELEMENT_USE_BASE_SCHEMA = z
  .object({
    persistentElementId: z.string().min(1),
    placement: placementSchema,
  })
  .passthrough();

const CONFORMANCE_MANIFEST_SCHEMA = z
  .object({
    designSystemId: designSystemIdSchema,
    slides: z.array(
      z
        .object({
          slideId: z.string().min(1),
          persistentElementUses: z.array(PERSISTENT_ELEMENT_USE_BASE_SCHEMA),
        })
        .strict(),
    ),
  })
  .strict();

export const conformanceManifestSchema = CONFORMANCE_MANIFEST_SCHEMA;

export type ConformanceManifest = Readonly<z.infer<typeof CONFORMANCE_MANIFEST_SCHEMA>>;

export type ConformanceErrorCode =
  | "INVALID_CONFORMANCE_MANIFEST"
  | "DESIGN_SYSTEM_MISMATCH"
  | "MISSING_REQUIRED_PERSISTENT_ELEMENT"
  | "DUPLICATE_PERSISTENT_ELEMENT_USE"
  | "UNKNOWN_PERSISTENT_ELEMENT"
  | "PERSISTENT_ELEMENT_MISMATCH";

type ManifestConformanceError = Readonly<{
  code: "INVALID_CONFORMANCE_MANIFEST";
  message: string;
  path: readonly (string | number)[];
}>;

type DesignSystemMismatchConformanceError = Readonly<{
  code: "DESIGN_SYSTEM_MISMATCH";
  message: string;
  path: readonly ["designSystemId"];
}>;

type SlidePersistentElementConformanceError = Readonly<{
  code:
    | "MISSING_REQUIRED_PERSISTENT_ELEMENT"
    | "DUPLICATE_PERSISTENT_ELEMENT_USE"
    | "UNKNOWN_PERSISTENT_ELEMENT"
    | "PERSISTENT_ELEMENT_MISMATCH";
  message: string;
  slideId: string;
  persistentElementId: string;
  path: readonly (string | number)[];
}>;

export type ConformanceError =
  | ManifestConformanceError
  | DesignSystemMismatchConformanceError
  | SlidePersistentElementConformanceError;

export type PresentationConformanceResult = Readonly<{
  passes: boolean;
  errors: readonly ConformanceError[];
}>;

type Use = ConformanceManifest["slides"][number]["persistentElementUses"][number];
type Element = DesignSystem["presentationKit"]["persistentElements"][number];

export const checkPresentationConformance = ({
  designSystem,
  manifest,
}: {
  designSystem: Pick<DesignSystem, "id" | "presentationKit">;
  manifest: unknown;
}): PresentationConformanceResult => {
  const parsed = conformanceManifestSchema.safeParse(manifest);
  if (!parsed.success) {
    return {
      passes: false,
      errors: [
        {
          code: "INVALID_CONFORMANCE_MANIFEST",
          message: z.prettifyError(parsed.error),
          path: [],
        },
      ],
    };
  }

  const validManifest = parsed.data;
  const errors: ConformanceError[] = [];
  if (validManifest.designSystemId !== designSystem.id) {
    errors.push({
      code: "DESIGN_SYSTEM_MISMATCH",
      message: `Conformance Manifest Design System '${validManifest.designSystemId}' does not match '${designSystem.id}'.`,
      path: ["designSystemId"],
    });
  }

  const elementsById = new Map(
    designSystem.presentationKit.persistentElements.map((element) => [element.id, element]),
  );
  const requiredElements = designSystem.presentationKit.persistentElements.filter(
    (element) => element.usagePolicy === "required",
  );

  validManifest.slides.forEach((slide, slideIndex) => {
    const usesById = new Map<string, Use>();
    slide.persistentElementUses.forEach((use, useIndex) => {
      if (usesById.has(use.persistentElementId)) {
        errors.push({
          code: "DUPLICATE_PERSISTENT_ELEMENT_USE",
          message: `Slide ${slide.slideId} declares Persistent Layout Element '${use.persistentElementId}' more than once.`,
          slideId: slide.slideId,
          persistentElementId: use.persistentElementId,
          path: ["slides", slideIndex, "persistentElementUses", useIndex, "persistentElementId"],
        });
      }
      usesById.set(use.persistentElementId, use);

      const element = elementsById.get(use.persistentElementId);
      if (!element) {
        errors.push({
          code: "UNKNOWN_PERSISTENT_ELEMENT",
          message: `Slide ${slide.slideId} declares unknown Persistent Layout Element '${use.persistentElementId}'.`,
          slideId: slide.slideId,
          persistentElementId: use.persistentElementId,
          path: ["slides", slideIndex, "persistentElementUses", useIndex, "persistentElementId"],
        });
        return;
      }

      const mismatch = mismatchMessage(element, use);
      if (mismatch) {
        errors.push({
          code: "PERSISTENT_ELEMENT_MISMATCH",
          message: `Slide ${slide.slideId} Persistent Layout Element '${element.id}' does not match its Design System definition: ${mismatch}.`,
          slideId: slide.slideId,
          persistentElementId: element.id,
          path: ["slides", slideIndex, "persistentElementUses", useIndex],
        });
      }
    });

    for (const element of requiredElements) {
      if (!usesById.has(element.id)) {
        errors.push({
          code: "MISSING_REQUIRED_PERSISTENT_ELEMENT",
          message: `Slide ${slide.slideId} is missing required Persistent Layout Element '${element.id}'.`,
          slideId: slide.slideId,
          persistentElementId: element.id,
          path: ["slides", slideIndex, "persistentElementUses"],
        });
      }
    }
  });

  return { passes: errors.length === 0, errors };
};

const mismatchMessage = (element: Element, use: Use): string | undefined => {
  const unexpectedKeys = Object.keys(use).filter((key) => !allowedUseKeysFor(element).has(key));
  if (unexpectedKeys.length > 0) {
    return `unexpected field '${unexpectedKeys[0]}'`;
  }

  if (JSON.stringify(use.placement) !== JSON.stringify(element.placement)) {
    return "placement differs";
  }

  switch (element.kind) {
    case "logo":
      return undefined;
    case "slideNumber":
      return sameJson(use.textStyle, element.textStyle) ? undefined : "textStyle differs";
    case "text":
      if (use.text !== element.text) return "text differs";
      return sameJson(use.textStyle, element.textStyle) ? undefined : "textStyle differs";
    case "shape":
      if (use.shape !== element.shape) return "shape differs";
      return sameJson(use.shapeStyle, element.shapeStyle) ? undefined : "shapeStyle differs";
  }
};

const BASE_USE_KEYS = ["persistentElementId", "placement"] as const;

const allowedUseKeysFor = (element: Element): ReadonlySet<string> => {
  switch (element.kind) {
    case "logo":
      return new Set(BASE_USE_KEYS);
    case "slideNumber":
      return new Set([...BASE_USE_KEYS, "textStyle"]);
    case "text":
      return new Set([...BASE_USE_KEYS, "text", "textStyle"]);
    case "shape":
      return new Set([...BASE_USE_KEYS, "shape", "shapeStyle"]);
  }
};

const sameJson = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);
