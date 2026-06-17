import type { PresentationKit as DbPresentationKit } from "@prisma/client";
import type { PresentationKitView } from "./presentation-kit";

export type PresentationKitRecord = Readonly<
  Pick<DbPresentationKit, "canvasWidth" | "canvasHeight" | "canvasUnit" | "designPrompt">
>;

export const toPresentationKitCreateRecord = (
  designSystemId: string,
  presentationKit: PresentationKitView,
) => ({
  designSystemId,
  canvasWidth: presentationKit.canvas.width,
  canvasHeight: presentationKit.canvas.height,
  canvasUnit: presentationKit.canvas.unit,
  designPrompt: presentationKit.designPrompt,
});

export const toPresentationKitView = (
  presentationKit: PresentationKitRecord,
): PresentationKitView => ({
  canvas: {
    width: presentationKit.canvasWidth,
    height: presentationKit.canvasHeight,
    unit: toSlideCanvasUnit(presentationKit.canvasUnit),
  },
  ...(presentationKit.designPrompt === null ? {} : { designPrompt: presentationKit.designPrompt }),
});

const toSlideCanvasUnit = (canvasUnit: string): PresentationKitView["canvas"]["unit"] => {
  if (canvasUnit === "px") return canvasUnit;
  throw new Error(`Unsupported Presentation Kit record Slide Canvas unit: ${canvasUnit}`);
};
