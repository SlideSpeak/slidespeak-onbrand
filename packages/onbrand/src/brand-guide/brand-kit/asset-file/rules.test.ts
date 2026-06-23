import { describe, expect, it } from "vitest";
import {
  asSupportedBrandKitAssetMimeType,
  brandKitAssetFilePreviewPath,
  SUPPORTED_BRAND_KIT_ASSET_MIME_TYPES,
} from "./rules";

describe("Brand Kit Asset File rules", () => {
  it("defines the supported remote file MIME types once", () => {
    expect(SUPPORTED_BRAND_KIT_ASSET_MIME_TYPES).toEqual([
      "image/svg+xml",
      "image/png",
      "image/jpeg",
      "image/webp",
    ]);
    expect(asSupportedBrandKitAssetMimeType("image/webp")).toBe("image/webp");
    expect(() => asSupportedBrandKitAssetMimeType("application/pdf")).toThrow(
      /Unsupported Brand Kit Asset File record MIME type/,
    );
  });

  it("builds the dashboard preview path without exposing S3 storage details", () => {
    expect(
      brandKitAssetFilePreviewPath({
        brandGuideId: "guide/with space",
        assetHandle: "DECORATIVE_ASSET_HERO_ORB",
      }),
    ).toBe("/api/brand-guides/guide%2Fwith%20space/assets/DECORATIVE_ASSET_HERO_ORB/preview");
  });
});
