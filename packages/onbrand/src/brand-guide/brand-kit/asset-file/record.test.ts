import { describe, expect, it } from "vitest";
import {
  brandKitAssetHandle,
  InvalidBrandGuideAssetUploadError,
  toBrandKitAssetFileRecord,
  toBrandKitAssetFileView,
  type BrandKitAssetRecord,
  type WritableBrandKitAssetRecord,
} from "./record";

const writableAsset = (
  overrides: Partial<WritableBrandKitAssetRecord> = {},
): WritableBrandKitAssetRecord => ({
  name: "Hero Orb",
  filename: "hero orb.png",
  mimeType: "image/png",
  description: "Use as a decorative background accent.",
  s3Key: "owner/guide/hero-orb/hero%20orb.png",
  byteSize: 42,
  sha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  ...overrides,
});

describe("Brand Kit Asset File records", () => {
  it("validates prepared upload keys while building writable records", () => {
    const record = toBrandKitAssetFileRecord({
      kind: "DECORATIVE_ASSET",
      ownerUserId: "owner",
      brandGuideId: "guide",
      asset: { ...writableAsset(), id: "hero-orb" },
      sortOrder: 3,
    });

    expect(record).toMatchObject({
      assetId: "hero-orb",
      kind: "DECORATIVE_ASSET",
      sortOrder: 3,
      s3Key: "owner/guide/hero-orb/hero%20orb.png",
    });
    expect(record).not.toHaveProperty("id");
  });

  it("rejects records that bypass prepared Brand Kit Asset File upload keys", () => {
    expect(() =>
      toBrandKitAssetFileRecord({
        kind: "LOGO",
        ownerUserId: "owner",
        brandGuideId: "guide",
        asset: { ...writableAsset({ s3Key: "other/key/logo.svg" }), assetId: "primary-logo" },
      }),
    ).toThrow(InvalidBrandGuideAssetUploadError);
  });

  it("projects consumer views and handles without leaking storage metadata", () => {
    const view = toBrandKitAssetFileView({
      assetId: "hero-orb",
      kind: "DECORATIVE_ASSET",
      name: "Hero Orb",
      filename: "hero.png",
      mimeType: "image/png",
      description: "Use as a decorative background accent.",
      s3Key: "owner/guide/hero-orb/hero.png",
      sortOrder: 1,
    } satisfies BrandKitAssetRecord);

    expect(brandKitAssetHandle({ kind: "DECORATIVE_ASSET", assetId: "hero-orb" })).toBe(
      "DECORATIVE_ASSET_HERO_ORB",
    );
    expect(view).toEqual({
      id: "hero-orb",
      name: "Hero Orb",
      assetHandle: "DECORATIVE_ASSET_HERO_ORB",
      filename: "hero.png",
      mimeType: "image/png",
      description: "Use as a decorative background accent.",
    });
    expect(view).not.toHaveProperty("s3Key");
  });
});
