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
    unit: "px",
  },
  ...(presentationKit.designPrompt === null ? {} : { designPrompt: presentationKit.designPrompt }),
});
