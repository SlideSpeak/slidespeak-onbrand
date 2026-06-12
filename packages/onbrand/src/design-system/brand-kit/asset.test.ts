import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import type { BrandKit } from "./brand-kit";
import { resolveBrandKitAssets, UnknownBrandKitAssetError } from "./asset";

const validBrandKit = (overrides: Partial<BrandKit> = {}): BrandKit => ({
  colors: [
    {
      id: "primary",
      name: "Primary",
      value: "#123ABC",
      description: "Use for primary emphasis.",
    },
    { id: "neutral-900", name: "Neutral 900", value: "#111827", description: "Use for text." },
  ],
  logo: {
    name: "Primary Logo",
    source: "./assets/logo.svg",
    description: "Use on light backgrounds.",
  },
  decorativeAssets: [],
  ...overrides,
});

const brandKitWithTextureAsset = (): BrandKit =>
  validBrandKit({
    decorativeAssets: [
      {
        id: "texture",
        name: "Texture",
        source: "assets/texture.png",
        description: "Use behind title content.",
      },
    ],
  });

const DEFAULT_FILES = {
  "assets/logo.svg": "<svg><title>Logo</title></svg>",
  "assets/wave-divider.svg": '<svg><path d="M0 0" /></svg>',
  "assets/texture.png": Buffer.from([0x89, 0x50, 0x4e, 0x47]),
};

describe("Brand Kit asset handling", () => {
  test("resolves Logo and Decorative Assets into MCP-facing metadata without source paths", async () => {
    const folderPath = await brandKitRoot();

    const result = await resolveBrandKitAssets({
      designSystemId: "acme",
      folderPath,
      brandKit: validBrandKit({
        decorativeAssets: [
          {
            id: "wave-divider",
            name: "Wave Divider",
            source: "assets/wave-divider.svg",
            description: "Use as a subtle section divider.",
          },
        ],
      }),
    });

    expect(result.mcpBrandKit).toEqual({
      colors: validBrandKit().colors,
      logo: {
        name: "Primary Logo",
        assetHandle: "LOGO",
        filename: "logo.svg",
        mimeType: "image/svg+xml",
        description: "Use on light backgrounds.",
      },
      decorativeAssets: [
        {
          id: "wave-divider",
          name: "Wave Divider",
          assetHandle: "DECORATIVE_ASSET_WAVE_DIVIDER",
          filename: "wave-divider.svg",
          mimeType: "image/svg+xml",
          description: "Use as a subtle section divider.",
        },
      ],
    });
    expect(keysDeep(result.mcpBrandKit)).not.toContain("source");
  });

  test("rejects duplicate Decorative Asset ids and duplicate materialization filenames", async () => {
    await expect(
      resolveBrandKitAssets({
        designSystemId: "acme",
        folderPath: await brandKitRoot(),
        brandKit: validBrandKit({
          decorativeAssets: [
            {
              id: "wave",
              name: "Wave",
              source: "assets/wave-divider.svg",
              description: "One.",
            },
            {
              id: "wave",
              name: "Wave Again",
              source: "assets/texture.png",
              description: "Two.",
            },
          ],
        }),
      }),
    ).rejects.toThrow(/Duplicate Decorative Asset id/);

    await expect(
      resolveBrandKitAssets({
        designSystemId: "acme",
        folderPath: await brandKitRoot(),
        brandKit: validBrandKit({
          decorativeAssets: [
            {
              id: "logo-copy",
              name: "Logo Copy",
              source: "assets/logo.svg",
              description: "Duplicate.",
            },
          ],
        }),
      }),
    ).rejects.toThrow(/Duplicate Brand Kit asset filename/);
  });

  test("materializes all Brand Kit assets in curated order when no handles are supplied", async () => {
    const folderPath = await brandKitRoot();
    const { assetIndex } = await resolveBrandKitAssets({
      designSystemId: "acme",
      folderPath,
      brandKit: brandKitWithTextureAsset(),
    });
    const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "onbrand-materialized-assets-"));

    const result = await assetIndex.materialize({
      outputDirectory,
    });

    expect(result.assets.map((asset) => asset.assetHandle)).toEqual([
      "LOGO",
      "DECORATIVE_ASSET_TEXTURE",
    ]);
    await expect(readFile(path.join(outputDirectory, "logo.svg"), "utf8")).resolves.toBe(
      "<svg><title>Logo</title></svg>",
    );
    await expect(readFile(path.join(outputDirectory, "texture.png"))).resolves.toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    );
  });

  test("materializes selected Brand Kit assets as local file copies without returning contents", async () => {
    const folderPath = await brandKitRoot();
    const { assetIndex } = await resolveBrandKitAssets({
      designSystemId: "acme",
      folderPath,
      brandKit: brandKitWithTextureAsset(),
    });
    const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "onbrand-materialized-assets-"));

    const result = await assetIndex.materialize({
      outputDirectory,
      assetHandles: ["LOGO", "DECORATIVE_ASSET_TEXTURE"],
    });

    expect(result).toEqual({
      designSystemId: "acme",
      outputDirectory,
      assets: [
        {
          kind: "LOGO",
          assetHandle: "LOGO",
          name: "Primary Logo",
          filename: "logo.svg",
          mimeType: "image/svg+xml",
          path: path.join(outputDirectory, "logo.svg"),
        },
        {
          kind: "DECORATIVE_ASSET",
          id: "texture",
          assetHandle: "DECORATIVE_ASSET_TEXTURE",
          name: "Texture",
          filename: "texture.png",
          mimeType: "image/png",
          path: path.join(outputDirectory, "texture.png"),
        },
      ],
    });
    await expect(readFile(path.join(outputDirectory, "logo.svg"), "utf8")).resolves.toBe(
      "<svg><title>Logo</title></svg>",
    );
    await expect(readFile(path.join(outputDirectory, "texture.png"))).resolves.toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    );
    expect(JSON.stringify(result)).not.toContain("<svg");
    expect(JSON.stringify(result)).not.toContain(
      Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64"),
    );
  });

  test("rejects unknown and duplicate requested Brand Kit asset handles", async () => {
    const folderPath = await brandKitRoot();
    const { assetIndex } = await resolveBrandKitAssets({
      designSystemId: "acme",
      folderPath,
      brandKit: brandKitWithTextureAsset(),
    });
    const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "onbrand-materialized-assets-"));

    await expect(
      assetIndex.materialize({
        outputDirectory,
        assetHandles: ["DECORATIVE_ASSET_MISSING"],
      }),
    ).rejects.toThrow(UnknownBrandKitAssetError);

    await expect(
      assetIndex.materialize({
        outputDirectory,
        assetHandles: ["LOGO", "LOGO"],
      }),
    ).rejects.toThrow(/Duplicate Brand Kit asset handle requested/);
  });

  test("honors overwrite=false when materialized filenames already exist", async () => {
    const folderPath = await brandKitRoot();
    const { assetIndex } = await resolveBrandKitAssets({
      designSystemId: "acme",
      folderPath,
      brandKit: brandKitWithTextureAsset(),
    });
    const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "onbrand-materialized-assets-"));
    await writeFile(path.join(outputDirectory, "logo.svg"), "existing");

    await expect(
      assetIndex.materialize({
        outputDirectory,
        assetHandles: ["LOGO"],
        overwrite: false,
      }),
    ).rejects.toMatchObject({ code: "EEXIST" });
    await expect(readFile(path.join(outputDirectory, "logo.svg"), "utf8")).resolves.toBe(
      "existing",
    );
  });
});

const keysDeep = (value: unknown): string[] => {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) => [key, ...keysDeep(nested)]);
};

const brandKitRoot = async (
  files: Record<string, string | Buffer> = DEFAULT_FILES,
): Promise<string> => {
  const root = await mkdtemp(path.join(os.tmpdir(), "onbrand-brand-kit-assets-"));
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(root, filePath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content);
  }
  return root;
};
