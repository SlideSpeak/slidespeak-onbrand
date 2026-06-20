import { createEnvRegistry, optionalString } from "@onbrand/env";
import type { S3 } from "@onbrand/s3";
import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, afterAll, vi } from "vitest";
import { createPrismaClient } from "../database/prisma-client";
import { PersistentBrandGuideApplication } from "./brand-guide-application";
import {
  DuplicateBrandGuideNameError,
  DuplicateDecorativeAssetNameError,
  UnknownBrandGuideError,
  type BrandGuideView,
} from "./application-service";
import type { BrandKitAssetRecord } from "./brand-kit/asset-file/record";
import type { BrandGuideRegistry } from "./brand-guide-store";

const Env = createEnvRegistry({
  ONBRAND_DATABASE_TESTS: optionalString("ONBRAND_DATABASE_TESTS"),
});

const describeDatabaseIntegration = Env.ONBRAND_DATABASE_TESTS === "1" ? describe : describe.skip;

const fakeS3: Pick<typeof S3, "getPresigned" | "putPresigned" | "deleteObject"> = {
  getPresigned: async ({ key }) => `https://s3.example/${key}`,
  putPresigned: async ({ key }) => `https://s3.example/upload/${key}`,
  deleteObject: async () => undefined,
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

describe("PersistentBrandGuideApplication registry seam", () => {
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

describe("PersistentBrandGuideApplication duplicate Brand Guide handling", () => {
  const owner = {
    ownerUserId: "test-owner-user",
  };

  it("rejects names that normalize to an existing Brand Guide slug before writing", async () => {
    const findUnique = vi.fn().mockResolvedValue({ name: "My Brand" });
    const create = vi.fn();
    const prisma = brandGuidePrismaStub({
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique,
      create,
    });
    const service = new PersistentBrandGuideApplication(
      prisma,
      fakeS3,
      "brand-kit-assets-test",
      900,
    );

    await expect(service.createBrandGuide(owner, { name: "My-Brand" })).rejects.toThrow(
      DuplicateBrandGuideNameError,
    );

    expect(findUnique).toHaveBeenCalledWith({
      where: { ownerUserId_slug: { ownerUserId: owner.ownerUserId, slug: "my-brand" } },
      select: { name: true },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("turns a Brand Guide slug race into a duplicate-name domain error", async () => {
    const prisma = brandGuidePrismaStub({
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi
        .fn()
        .mockRejectedValue({ code: "P2002", meta: { target: ["ownerUserId", "slug"] } }),
    });
    const service = new PersistentBrandGuideApplication(
      prisma,
      fakeS3,
      "brand-kit-assets-test",
      900,
    );

    const result = service.createBrandGuide(owner, { name: "My-Brand" });

    await expect(result).rejects.toThrow(DuplicateBrandGuideNameError);
    await expect(result).rejects.not.toMatchObject({ code: "P2002" });
  });
});

describe("PersistentBrandGuideApplication decorative asset duplicate handling", () => {
  const owner = {
    ownerUserId: "test-owner-user",
  };

  it("rejects renamed decorative assets that normalize to an existing asset id before writing", async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce({ id: "asset-being-renamed", s3Key: "old-key" })
      .mockResolvedValueOnce({ id: "colliding-asset", s3Key: "other-key" });
    const update = vi.fn();
    const upsert = vi.fn();
    const prisma = {
      brandGuide: {
        findUnique: vi.fn().mockResolvedValue({
          id: "brand-guide-row",
          slug: "skyleague",
          name: "SKYLEAGUE Brand Guide",
          description: null,
          brandKit: { id: "brand-kit-row", assets: [], colors: [] },
          presentationKit: null,
        }),
      },
      brandKitAsset: {
        findUnique,
        update,
        upsert,
      },
    } as unknown as PrismaClient;
    const service = new PersistentBrandGuideApplication(
      prisma,
      fakeS3,
      "brand-kit-assets-test",
      900,
    );

    const result = service.upsertDecorativeAsset(owner, {
      brandGuideId: "skyleague",
      previousName: "Icon 1",
      asset: {
        name: "Icon 2",
        filename: "icon-1.svg",
        mimeType: "image/svg+xml",
        description: null,
        s3Key: "",
        byteSize: 123,
        sha256: "abc123",
      },
    });

    await expect(result).rejects.toThrow(DuplicateDecorativeAssetNameError);
    await expect(result).rejects.not.toMatchObject({ code: "P2002" });
    expect(findUnique).toHaveBeenNthCalledWith(2, {
      where: { brandKitId_assetId: { brandKitId: "brand-kit-row", assetId: "icon-2" } },
      select: { id: true, s3Key: true },
    });
    expect(update).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
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

const brandGuidePrismaStub = (brandGuide: {
  findFirst: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
}): PrismaClient =>
  ({
    brandGuide,
  }) as unknown as PrismaClient;
