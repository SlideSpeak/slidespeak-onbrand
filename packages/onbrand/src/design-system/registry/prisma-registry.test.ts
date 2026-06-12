import type { S3 } from "@onbrand/s3";
import { describe, expect, it, afterAll } from "vitest";
import { createPrismaClient } from "../../database/prisma-client";
import { PrismaDesignSystemRegistry } from "./prisma-registry";
import { UnknownDesignSystemError } from "./registry";

const describeDatabaseIntegration =
  process.env.ONBRAND_DATABASE_TESTS === "1" ? describe : describe.skip;

const fakeS3: Pick<typeof S3, "getPresigned"> = {
  getPresigned: async ({ key }) => `https://s3.example/${key}`,
};

describeDatabaseIntegration("PrismaDesignSystemRegistry", () => {
  const prisma = createPrismaClient();
  const registry = new PrismaDesignSystemRegistry(prisma, fakeS3, "brand-kit-assets-test", 900);
  const auth = {
    ownerUserId: process.env.ONBRAND_OWNER_USER_ID ?? "local-dev-user",
    scopes: ["onbrand:read", "onbrand:write"],
  };

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("lists Design Systems from Postgres", async () => {
    const designSystems = await registry.listDesignSystems(auth);
    const skyleague = designSystems.find((designSystem) => designSystem.id === "skyleague");

    expect(skyleague?.name).toBe("SKYLEAGUE Design System");
    expect(skyleague?.description).toContain("high-energy SKYLEAGUE");
  });

  it("returns the full MCP Design System assembled from normalized tables", async () => {
    const result = await registry.getDesignSystem(auth, "skyleague");

    expect(result.designSystem.id).toBe("skyleague");
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

  it("returns selected Brand Kit asset S3 download commands", async () => {
    const result = await registry.materializeBrandKitAssets(auth, {
      designSystemId: "skyleague",
      outputDirectory: "assets",
      assetHandles: ["LOGO"],
    });

    expect(result.assets).toEqual([
      expect.objectContaining({
        kind: "LOGO",
        filename: "logo.svg",
        assetHandle: "LOGO",
        mimeType: "image/svg+xml",
        targetPath: "assets/logo.svg",
        relativePath: "assets/logo.svg",
      }),
    ]);
    expect(JSON.stringify(result)).not.toContain("contentBase64");
  });

  it("rejects unknown Design Systems", async () => {
    await expect(registry.getDesignSystem(auth, "missing")).rejects.toThrow(
      UnknownDesignSystemError,
    );
  });
});
