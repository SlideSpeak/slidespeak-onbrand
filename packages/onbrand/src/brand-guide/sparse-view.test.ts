import { describe, expect, test } from "vitest";
import { toBrandKitView } from "./brand-kit/record";
import { toPresentationKitView } from "./presentation-kit/record";

describe("sparse Brand Guide views", () => {
  test("represents an empty Brand Kit with empty collections and null logo", () => {
    expect(toBrandKitView([], [])).toEqual({ colors: [], logo: null, decorativeAssets: [] });
  });

  test("represents an empty Presentation Kit with null canvas and null design prompt", () => {
    expect(
      toPresentationKitView({
        canvasWidth: null,
        canvasHeight: null,
        canvasUnit: null,
        designPrompt: null,
      }),
    ).toEqual({ canvas: null, designPrompt: null });
  });
});
