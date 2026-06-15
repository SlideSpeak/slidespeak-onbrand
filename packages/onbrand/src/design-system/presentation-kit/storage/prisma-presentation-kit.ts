import type { PresentationKitView } from "../../application-service";

export type StoredPresentationKit = Readonly<{
  canvasWidth: number;
  canvasHeight: number;
  canvasUnit: string;
  designPrompt: string | null;
}>;

export const toPresentationKitView = (
  presentationKit: StoredPresentationKit,
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
  throw new Error(`Unsupported stored Slide Canvas unit: ${canvasUnit}`);
};
