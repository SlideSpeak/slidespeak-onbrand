import { describe, expect, test } from "vitest";
import { assetSlugSchema, uploadDeclarationSchema } from "./asset-schemas";

describe("asset schemas", () => {
  test("accepts lowercase asset slugs", () => {
    expect(assetSlugSchema.safeParse("primary-logo").success).toBe(true);
    expect(assetSlugSchema.safeParse("hero-orb").success).toBe(true);
    expect(assetSlugSchema.safeParse("icon-1").success).toBe(true);
  });

  test("rejects consumer handles as upload asset ids", () => {
    expect(assetSlugSchema.safeParse("LOGO").success).toBe(false);
    expect(assetSlugSchema.safeParse("DECORATIVE_ASSET_HERO_ORB").success).toBe(false);
    expect(assetSlugSchema.safeParse("hero_orb").success).toBe(false);
  });

  test("enforces slug asset ids on upload declarations", () => {
    const upload = {
      assetId: "DECORATIVE_ASSET_HERO_ORB",
      filename: "hero.png",
      mimeType: "image/png",
      byteSize: 1,
      sha256: "0".repeat(64),
    };

    expect(uploadDeclarationSchema.safeParse(upload).success).toBe(false);
  });
});
