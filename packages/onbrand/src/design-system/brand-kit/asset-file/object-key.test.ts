import { describe, expect, test } from "vitest";
import { brandKitAssetFileObjectKey } from "./object-key";

describe("brandKitAssetFileObjectKey", () => {
  test("builds stable per-user Design System Brand Kit Asset File keys", () => {
    expect(
      brandKitAssetFileObjectKey({
        ownerUserId: "user/1",
        designSystemId: "skyleague",
        assetId: "hero-orb",
        filename: "hero orb.png",
      }),
    ).toBe("user%252F1/skyleague/hero-orb/hero%20orb.png");
  });
});
