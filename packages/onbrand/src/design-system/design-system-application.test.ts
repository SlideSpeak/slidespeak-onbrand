import { createEnvRegistry, optionalString } from "@onbrand/env";
import type { S3 } from "@onbrand/s3";
import { describe, expect, it, afterAll } from "vitest";
import { createPrismaClient } from "../database/prisma-client";
import { PersistentDesignSystemApplication } from "./design-system-application";
import { UnknownDesignSystemError } from "./application-service";

const Env = createEnvRegistry({
  ONBRAND_DATABASE_TESTS: optionalString("ONBRAND_DATABASE_TESTS"),
});

const describeDatabaseIntegration = Env.ONBRAND_DATABASE_TESTS === "1" ? describe : describe.skip;

const fakeS3: Pick<typeof S3, "getPresigned" | "putPresigned"> = {
  getPresigned: async ({ key }) => `https://s3.example/${key}`,
  putPresigned: async ({ key }) => `https://s3.example/upload/${key}`,
};

describeDatabaseIntegration("PersistentDesignSystemApplication", () => {
  const prisma = createPrismaClient();
  const service = new PersistentDesignSystemApplication(
    prisma,
    fakeS3,
    "brand-kit-assets-test",
    900,
  );
  const owner = {
    ownerUserId: "test-owner-user",
  };

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("lists Design Systems from Postgres", async () => {
    const designSystems = await service.listDesignSystems(owner);
    const skyleague = designSystems.find((designSystem) => designSystem.id === "skyleague");

    expect(skyleague?.name).toBe("SKYLEAGUE Design System");
    expect(skyleague?.description).toContain("high-energy SKYLEAGUE");
  });

  it("returns the full Design System view assembled from normalized tables", async () => {
    const result = await service.getDesignSystem(owner, "skyleague");

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

  it("returns Brand Kit asset S3 download commands", async () => {
    const result = await service.materializeBrandKitAssets(owner, {
      designSystemId: "skyleague",
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

  it("rejects unknown Design Systems", async () => {
    await expect(service.getDesignSystem(owner, "missing")).rejects.toThrow(
      UnknownDesignSystemError,
    );
  });
});
