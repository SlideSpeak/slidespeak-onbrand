import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, afterAll } from "vitest";
import { createPrismaClient } from "../../database/prisma-client";
import { PrismaDesignSystemRegistry } from "./prisma-registry";
import { UnknownDesignSystemError } from "./registry";

const describeDatabaseIntegration =
  process.env.ONBRAND_DATABASE_TESTS === "1" ? describe : describe.skip;

describeDatabaseIntegration("PrismaDesignSystemRegistry", () => {
  const prisma = createPrismaClient();
  const registry = new PrismaDesignSystemRegistry(prisma);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("lists Design Systems from Postgres", async () => {
    const designSystems = await registry.listDesignSystems();
    const skyleague = designSystems.find((designSystem) => designSystem.id === "skyleague");

    expect(skyleague?.name).toBe("SKYLEAGUE Design System");
    expect(skyleague?.description).toContain("high-energy SKYLEAGUE");
  });

  it("returns the full MCP Design System assembled from normalized tables", async () => {
    const result = await registry.getDesignSystem("skyleague");

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

  it("materializes selected Brand Kit assets from stored bytes", async () => {
    const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "onbrand-assets-"));
    try {
      const result = await registry.materializeBrandKitAssets({
        designSystemId: "skyleague",
        outputDirectory,
        assetHandles: ["LOGO"],
      });

      expect(result.assets).toEqual([
        expect.objectContaining({ kind: "LOGO", filename: "logo.svg", assetHandle: "LOGO" }),
      ]);
      await expect(readFile(path.join(outputDirectory, "logo.svg"), "utf8")).resolves.toContain(
        "svg",
      );
    } finally {
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });

  it("rejects unknown Design Systems", async () => {
    await expect(registry.getDesignSystem("missing")).rejects.toThrow(UnknownDesignSystemError);
  });
});
