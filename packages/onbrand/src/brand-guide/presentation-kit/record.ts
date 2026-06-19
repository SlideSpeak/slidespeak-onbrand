import type { PresentationKitView } from "./presentation-kit";

export type PresentationKitRecord = Readonly<{
  canvasWidth: number | null;
  canvasHeight: number | null;
  canvasUnit: string | null;
  designPrompt: string | null;
}>;

export const toPresentationKitWriteRecord = (presentationKit: PresentationKitView) => ({
  canvasWidth: presentationKit.canvas?.width ?? null,
  canvasHeight: presentationKit.canvas?.height ?? null,
  canvasUnit: presentationKit.canvas?.unit ?? null,
  designPrompt: presentationKit.designPrompt,
});

export const toPresentationKitCreateRecord = (
  brandGuideId: string,
  presentationKit: PresentationKitView,
) => ({
  brandGuideId,
  ...toPresentationKitWriteRecord(presentationKit),
});

export const toPresentationKitView = (
  presentationKit: PresentationKitRecord | null,
): PresentationKitView => ({
  canvas:
    presentationKit?.canvasWidth && presentationKit.canvasHeight && presentationKit.canvasUnit
      ? {
          width: presentationKit.canvasWidth,
          height: presentationKit.canvasHeight,
          unit: toSlideCanvasUnit(presentationKit.canvasUnit),
        }
      : null,
  designPrompt: presentationKit?.designPrompt ?? null,
});

const toSlideCanvasUnit = (canvasUnit: string): NonNullable<PresentationKitView["canvas"]>["unit"] => {
  if (canvasUnit === "px") return canvasUnit;
  throw new Error(`Unsupported Presentation Kit record Slide Canvas unit: ${canvasUnit}`);
};
