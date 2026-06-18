import { describe, expect, test } from "vitest";
import { brandKitAssetFileObjectKey } from "./object-key";

describe("brandKitAssetFileObjectKey", () => {
  test("builds stable per-user Brand Guide Brand Kit Asset File keys", () => {
    expect(
      brandKitAssetFileObjectKey({
        ownerUserId: "user/1",
        brandGuideId: "skyleague",
        assetId: "hero-orb",
        filename: "hero orb.png",
      }),
    ).toBe("user%252F1/skyleague/hero-orb/hero%20orb.png");
  });
});
