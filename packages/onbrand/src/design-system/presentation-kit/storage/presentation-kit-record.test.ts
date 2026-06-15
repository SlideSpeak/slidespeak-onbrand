import { describe, expect, it } from "vitest";
import { toPresentationKitView } from "./presentation-kit-record";

describe("toPresentationKitView", () => {
  it("maps a persisted Presentation Kit into the domain view", () => {
    const view = toPresentationKitView({
      canvasWidth: 1280,
      canvasHeight: 720,
      canvasUnit: "px",
      designPrompt: "Use crisp editorial layouts.",
    });

    expect(view).toEqual({
      canvas: { width: 1280, height: 720, unit: "px" },
      designPrompt: "Use crisp editorial layouts.",
    });
  });

  it("rejects persisted Presentation Kits with unsupported canvas units", () => {
    expect(() =>
      toPresentationKitView({
        canvasWidth: 1280,
        canvasHeight: 720,
        canvasUnit: "em",
        designPrompt: null,
      }),
    ).toThrow();
  });
});
