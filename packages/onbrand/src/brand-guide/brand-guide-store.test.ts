import { describe, expect, it } from "vitest";
import { InvalidBrandGuideAssetUploadError } from "./application-service";
import { PrismaBrandGuideRegistry } from "./brand-guide-store";
import type { WriteBrandGuideRequest } from "./application-service";

const writeRequest = (s3Key: string): WriteBrandGuideRequest => ({
  brandGuide: {
    id: "skyleague",
    name: "SKYLEAGUE Brand Guide",
    description: "High-energy SKYLEAGUE identity and presentation rules.",
  },
  brandKit: {
    colors: [
      {
        id: "sky-blue",
        name: "Sky Blue",
        value: "#00AEEF",
        description: "Primary action color.",
      },
    ],
    logo: {
      assetId: "logo",
      name: "Primary Logo",
      filename: "logo.svg",
      mimeType: "image/svg+xml",
      description: "Primary Logo for light backgrounds.",
      s3Key,
      byteSize: 128,
      sha256: "a".repeat(64),
    },
    decorativeAssets: [
      {
        id: "hero-orb",
        name: "Hero Orb",
        filename: "hero-orb.png",
        mimeType: "image/png",
        description: "Decorative energy accent.",
        s3Key: "brand-kit-assets/test-owner-user/skyleague/hero-orb/hero-orb.png",
        byteSize: 256,
        sha256: "b".repeat(64),
      },
    ],
  },
  presentationKit: {
    canvas: { width: 1280, height: 720, unit: "px" },
    designPrompt: "Use energetic, sport-forward slide layouts.",
  },
});

describe("PrismaBrandGuideRegistry", () => {
  it("keeps Brand Kit Asset File validation inside the replace seam", async () => {
    const prisma = {
      $transaction: async () => {
        throw new Error("transaction should not start for invalid Brand Kit Asset File records");
      },
    };
    const registry = new PrismaBrandGuideRegistry(prisma as never);

    await expect(
      registry.replace(
        { ownerUserId: "test-owner-user" },
        writeRequest("brand-kit-assets/test-owner-user/skyleague/logo/wrong.svg"),
      ),
    ).rejects.toThrow(InvalidBrandGuideAssetUploadError);
  });
});
