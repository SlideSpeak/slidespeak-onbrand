import { describe, expect, it } from "vitest";
import { BrandKitAssetFileWorkflow, normalizeOutputDirectory } from "./workflow";

describe("Brand Kit Asset File output directory normalization", () => {
  it("normalizes relative workspace paths", () => {
    expect(normalizeOutputDirectory(" ./assets/ ")).toBe("assets");
    expect(normalizeOutputDirectory("./assets/icons/")).toBe("assets/icons");
    expect(normalizeOutputDirectory("   ")).toBe(".");
  });

  it("rejects paths that can escape the workspace", () => {
    expect(() => normalizeOutputDirectory("/tmp/assets")).toThrow(/relative to the workspace/);
    expect(() => normalizeOutputDirectory("../assets")).toThrow(/must not contain '\.\.'/);
    expect(() => normalizeOutputDirectory("assets/../outside")).toThrow(/must not contain '\.\.'/);
  });
});

describe("Brand Kit Asset File materialization", () => {
  it("returns presigned download commands and relative paths for client workspaces", async () => {
    const workflow = new BrandKitAssetFileWorkflow(
      {
        getPresigned: async ({ key, filename }) =>
          `https://s3.example/download/${key}?filename=${filename}`,
        putPresigned: async () => "unused",
        deleteObject: async () => undefined,
      },
      "brand-kit-assets",
      900,
    );

    const result = await workflow.materialize({
      brandGuideId: "skyleague",
      outputDirectory: "./assets/",
      assets: [
        {
          assetId: "primary-logo",
          kind: "LOGO",
          name: "Primary Logo",
          filename: "logo.svg",
          mimeType: "image/svg+xml",
          description: "Use on dark backgrounds.",
          s3Key: "owner/skyleague/primary-logo/logo.svg",
          sortOrder: 0,
        },
      ],
    });

    expect(result.outputDirectory).toBe("assets");
    expect(result.commands).toContain("mkdir -p 'assets'");
    expect(result.commands[1]).toBe(
      "curl -fsSL 'https://s3.example/download/owner/skyleague/primary-logo/logo.svg?filename=logo.svg' -o 'assets/logo.svg'",
    );
    expect(result.assets[0]).toMatchObject({
      kind: "LOGO",
      assetHandle: "LOGO",
      targetPath: "assets/logo.svg",
      relativePath: "assets/logo.svg",
      downloadUrl:
        "https://s3.example/download/owner/skyleague/primary-logo/logo.svg?filename=logo.svg",
    });
    expect(JSON.stringify(result)).not.toContain("contentBase64");
  });
});
