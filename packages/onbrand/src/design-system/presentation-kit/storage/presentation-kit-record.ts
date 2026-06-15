import type { PresentationKit as DbPresentationKit } from "@prisma/client";
import type { PresentationKitView } from "../../application-service";

export type PresentationKitRecord = Readonly<
  Pick<DbPresentationKit, "canvasWidth" | "canvasHeight" | "canvasUnit" | "designPrompt">
>;

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

const toSlideCanvasUnit = (canvasUnit: string): "px" => {
  if (canvasUnit === "px") return canvasUnit;
  throw new Error(`Unsupported Presentation Kit record Slide Canvas unit: ${canvasUnit}`);
};
