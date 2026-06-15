import { describe, expect, it } from "vitest";
import { toPresentationKitView } from "./presentation-kit-record";

describe("toPresentationKitView", () => {
  it("maps the Presentation Kit record canvas unit", () => {
    expect(
      toPresentationKitView({
        canvasWidth: 1280,
        canvasHeight: 720,
        canvasUnit: "px",
        designPrompt: null,
      }).canvas,
    ).toEqual({ width: 1280, height: 720, unit: "px" });
  });

  it("rejects unsupported Presentation Kit record canvas units", () => {
    expect(() =>
      toPresentationKitView({
        canvasWidth: 1280,
        canvasHeight: 720,
        canvasUnit: "em",
        designPrompt: null,
      }),
    ).toThrow("Unsupported Presentation Kit record Slide Canvas unit: em");
  });
});
