import { createEnvRegistry, optionalString } from "@onbrand/env";
import type { S3 } from "@onbrand/s3";
import { describe, expect, it, afterAll } from "vitest";
import { createPrismaClient } from "../database/prisma-client";
import { PersistentBrandGuideApplication } from "./brand-guide-application";
import { UnknownBrandGuideError, type BrandGuideView } from "./application-service";
import type { BrandKitAssetRecord } from "./brand-kit/asset-file/record";
import type { BrandGuideRegistry } from "./brand-guide-store";

const Env = createEnvRegistry({
  ONBRAND_DATABASE_TESTS: optionalString("ONBRAND_DATABASE_TESTS"),
});

const describeDatabaseIntegration = Env.ONBRAND_DATABASE_TESTS === "1" ? describe : describe.skip;

const fakeS3: Pick<typeof S3, "getPresigned" | "putPresigned"> = {
  getPresigned: async ({ key }) => `https://s3.example/${key}`,
  putPresigned: async ({ key }) => `https://s3.example/upload/${key}`,
};

const memoryBrandGuideView: BrandGuideView = {
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
      assetHandle: "LOGO",
      name: "Primary Logo",
      filename: "logo.svg",
      mimeType: "image/svg+xml",
      description: "Primary Logo for light backgrounds.",
    },
    decorativeAssets: [],
  },
  presentationKit: {
    canvas: { width: 1280, height: 720, unit: "px" },
    designPrompt: "Use energetic, sport-forward slide layouts.",
  },
};

const memoryAssets: readonly BrandKitAssetRecord[] = [
  {
    assetId: "logo",
    kind: "LOGO",
    name: "Primary Logo",
    filename: "logo.svg",
    mimeType: "image/svg+xml",
    description: "Primary Logo for light backgrounds.",
    s3Key: "brand-kit-assets/test-owner-user/skyleague/logo/logo.svg",
    sortOrder: 0,
  },
];

class InMemoryBrandGuideRegistry implements BrandGuideRegistry {
  readonly replaceRequests: unknown[] = [];

  list = async () => [memoryBrandGuideView.brandGuide];

  load = async () => memoryBrandGuideView;

  loadBrandKitAssets = async () => memoryAssets;

  replace = async (_owner: unknown, request: unknown) => {
    this.replaceRequests.push(request);
    return {
      brandGuideId: memoryBrandGuideView.brandGuide.id,
      action: "CREATED" as const,
      brandGuide: memoryBrandGuideView,
    };
  };
}

describe("PersistentBrandGuideApplication", () => {
  it("materializes Brand Kit Asset Files through the Brand Guide Registry seam", async () => {
    const registry = new InMemoryBrandGuideRegistry();
    const service = new PersistentBrandGuideApplication(
      {} as never,
      fakeS3,
      "brand-kit-assets-test",
      900,
      registry,
    );

    const plan = await service.materializeBrandKitAssets(
      { ownerUserId: "test-owner-user" },
      { brandGuideId: "skyleague", outputDirectory: "assets" },
    );

    expect(plan.assets).toEqual([
      expect.objectContaining({
        kind: "LOGO",
        assetHandle: "LOGO",
        filename: "logo.svg",
        downloadUrl: "https://s3.example/brand-kit-assets/test-owner-user/skyleague/logo/logo.svg",
      }),
    ]);
  });

  it("delegates Brand Guide writes to the registry replace interface", async () => {
    const registry = new InMemoryBrandGuideRegistry();
    const service = new PersistentBrandGuideApplication(
      {} as never,
      fakeS3,
      "brand-kit-assets-test",
      900,
      registry,
    );

    const result = await service.writeBrandGuide(
      { ownerUserId: "test-owner-user" },
      {
        brandGuide: memoryBrandGuideView.brandGuide,
        brandKit: {
          colors: memoryBrandGuideView.brandKit.colors,
          logo: {
            assetId: "logo",
            name: "Primary Logo",
            filename: "logo.svg",
            mimeType: "image/svg+xml",
            description: "Primary Logo for light backgrounds.",
            s3Key: "brand-kit-assets/test-owner-user/skyleague/logo/logo.svg",
            byteSize: 128,
            sha256: "a".repeat(64),
          },
        },
        presentationKit: memoryBrandGuideView.presentationKit,
      },
    );

    expect(result.action).toBe("CREATED");
    expect(registry.replaceRequests).toHaveLength(1);
  });
});

describeDatabaseIntegration("PersistentBrandGuideApplication", () => {
  const prisma = createPrismaClient();
  const service = new PersistentBrandGuideApplication(prisma, fakeS3, "brand-kit-assets-test", 900);
  const owner = {
    ownerUserId: "test-owner-user",
  };

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("lists Brand Guides from Postgres", async () => {
    const brandGuides = await service.listBrandGuides(owner);
    const skyleague = brandGuides.find((brandGuide) => brandGuide.id === "skyleague");

    expect(skyleague?.name).toBe("SKYLEAGUE Brand Guide");
    expect(skyleague?.description).toContain("high-energy SKYLEAGUE");
  });

  it("returns the full Brand Guide view assembled from normalized tables", async () => {
    const result = await service.getBrandGuide(owner, "skyleague");

    expect(result.brandGuide.id).toBe("skyleague");
    expect(result.brandKit.colors).toHaveLength(10);
    expect(result.brandKit.logo).toMatchObject({
      assetHandle: "LOGO",
      filename: "logo.svg",
      mimeType: "image/svg+xml",
    });
    expect(result.brandKit.decorativeAssets.map((asset) => asset.assetHandle)).toEqual([
      "DECORATIVE_ASSET_HERO_ORB",
      "DECORATIVE_ASSET_CIRCLE",
      "DECORATIVE_ASSET_ICON_1",
      "DECORATIVE_ASSET_ICON_2",
    ]);
    expect(result.presentationKit.canvas).toEqual({ width: 1280, height: 720, unit: "px" });
    expect(result.presentationKit.designPrompt).toContain("SKYLEAGUE");
  });

  it("returns Brand Kit asset S3 download commands", async () => {
    const result = await service.materializeBrandKitAssets(owner, {
      brandGuideId: "skyleague",
      outputDirectory: "assets",
    });

    expect(result.assets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "LOGO",
          filename: "logo.svg",
          assetHandle: "LOGO",
          mimeType: "image/svg+xml",
          targetPath: "assets/logo.svg",
          relativePath: "assets/logo.svg",
        }),
      ]),
    );
    expect(JSON.stringify(result)).not.toContain("contentBase64");
  });

  it("rejects unknown Brand Guides", async () => {
    await expect(service.getBrandGuide(owner, "missing")).rejects.toThrow(UnknownBrandGuideError);
  });
});
