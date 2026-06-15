import { describe, expect, it } from "vitest";
import { toPresentationKitView } from "./prisma-presentation-kit";

describe("toPresentationKitView", () => {
  it("maps the stored canvas unit", () => {
    expect(
      toPresentationKitView({
        canvasWidth: 1280,
        canvasHeight: 720,
        canvasUnit: "px",
        designPrompt: null,
      }).canvas,
    ).toEqual({ width: 1280, height: 720, unit: "px" });
  });

  it("rejects unsupported stored canvas units", () => {
    expect(() =>
      toPresentationKitView({
        canvasWidth: 1280,
        canvasHeight: 720,
        canvasUnit: "em",
        designPrompt: null,
      }),
    ).toThrow("Unsupported stored Slide Canvas unit: em");
  });
});
