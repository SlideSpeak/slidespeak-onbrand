import { describe, expect, it, vi } from "vitest";
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
        s3Key: "test-owner-user/skyleague/hero-orb/hero-orb.png",
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

  it("returns the Brand Guide view persisted inside the replace transaction", async () => {
    const persistedRecord = {
      id: "db-brand-guide-id",
      slug: "skyleague",
      name: "SKYLEAGUE Brand Guide",
      description: "High-energy SKYLEAGUE identity and presentation rules.",
      brandKit: {
        assets: [
          {
            assetId: "logo",
            kind: "LOGO",
            name: "Primary Logo",
            filename: "logo.svg",
            mimeType: "image/svg+xml",
            description: "Primary Logo for light backgrounds.",
            s3Key: "test-owner-user/skyleague/logo/logo.svg",
            sortOrder: 0,
          },
          {
            assetId: "hero-orb",
            kind: "DECORATIVE_ASSET",
            name: "Hero Orb",
            filename: "hero-orb.png",
            mimeType: "image/png",
            description: "Decorative energy accent.",
            s3Key: "test-owner-user/skyleague/hero-orb/hero-orb.png",
            sortOrder: 1,
          },
        ],
        colors: [
          {
            tokenId: "sky-blue",
            name: "Sky Blue",
            value: "#00AEEF",
            description: "Primary action color.",
          },
        ],
      },
      presentationKit: {
        canvasWidth: 1280,
        canvasHeight: 720,
        canvasUnit: "px",
        designPrompt: "Use energetic, sport-forward slide layouts.",
      },
    };
    type BrandGuideFindUniqueArgs = Readonly<{ include?: unknown }>;

    const transactionBrandGuide = {
      findUnique: vi.fn(async (args: BrandGuideFindUniqueArgs) =>
        args.include ? persistedRecord : null,
      ),
      upsert: vi.fn(async () => ({
        id: persistedRecord.id,
        slug: persistedRecord.slug,
        name: persistedRecord.name,
        description: persistedRecord.description,
      })),
    };
    const tx = {
      brandGuide: transactionBrandGuide,
      brandKit: {
        deleteMany: vi.fn(async () => ({ count: 0 })),
        create: vi.fn(async () => ({})),
      },
      presentationKit: {
        deleteMany: vi.fn(async () => ({ count: 0 })),
        create: vi.fn(async () => ({})),
      },
    };
    const runTransaction = async <Result>(
      callback: (transactionClient: typeof tx) => Promise<Result>,
    ): Promise<Result> => callback(tx);
    const prisma = {
      brandGuide: {
        findUnique: vi.fn(async () => {
          throw new Error("replace must not read Brand Guide state after the transaction commits");
        }),
      },
      $transaction: vi.fn(runTransaction),
    };
    const registry = new PrismaBrandGuideRegistry(prisma as never);

    const result = await registry.replace(
      { ownerUserId: "test-owner-user" },
      writeRequest("test-owner-user/skyleague/logo/logo.svg"),
    );

    expect(result).toEqual({
      brandGuideId: "skyleague",
      action: "CREATED",
      brandGuide: {
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
            name: "Primary Logo",
            assetHandle: "LOGO",
            filename: "logo.svg",
            mimeType: "image/svg+xml",
            description: "Primary Logo for light backgrounds.",
          },
          decorativeAssets: [
            {
              id: "hero-orb",
              name: "Hero Orb",
              assetHandle: "DECORATIVE_ASSET_HERO_ORB",
              filename: "hero-orb.png",
              mimeType: "image/png",
              description: "Decorative energy accent.",
            },
          ],
        },
        presentationKit: {
          canvas: { width: 1280, height: 720, unit: "px" },
          designPrompt: "Use energetic, sport-forward slide layouts.",
        },
      },
    });
    expect(prisma.brandGuide.findUnique).not.toHaveBeenCalled();
    expect(transactionBrandGuide.findUnique).toHaveBeenCalledTimes(2);
  });
});
