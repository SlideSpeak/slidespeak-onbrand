import { describe, expect, it, afterAll } from "vitest";
import { createPrismaClient } from "../../database/prisma-client";
import { PrismaDesignSystemRegistry } from "./prisma-registry";
import { UnknownDesignSystemError } from "./registry";

const describeDatabaseIntegration =
  process.env.ONBRAND_DATABASE_TESTS === "1" ? describe : describe.skip;

describeDatabaseIntegration("PrismaDesignSystemRegistry", () => {
  const prisma = createPrismaClient();
  const registry = new PrismaDesignSystemRegistry(prisma);
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

  it("returns selected Brand Kit asset files as base64 from stored bytes", async () => {
    const result = await registry.getBrandKitAssetFiles(auth, {
      designSystemId: "skyleague",
      assetHandles: ["LOGO"],
    });

    expect(result.assets).toEqual([
      expect.objectContaining({
        kind: "LOGO",
        filename: "logo.svg",
        assetHandle: "LOGO",
        mimeType: "image/svg+xml",
      }),
    ]);
    const [logo] = result.assets;
    expect(Buffer.from(logo.contentBase64, "base64").toString("utf8")).toContain("svg");
  });

  it("rejects unknown Design Systems", async () => {
    await expect(registry.getDesignSystem(auth, "missing")).rejects.toThrow(
      UnknownDesignSystemError,
    );
  });
});
