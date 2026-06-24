import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, test } from "vitest";
import type { BrandGuideApplicationService } from "@onbrand/core/brand-guide/application-service";
import { createOnbrandMcpServer, toToolResult } from "./server";

type ToolResultRecord = Record<string, unknown>;

const callTool = async (
  client: Client,
  request: Parameters<Client["callTool"]>[0],
): Promise<ToolResultRecord> => await client.callTool(request);

const record = (value: unknown): ToolResultRecord => {
  expect(value).toBeTypeOf("object");
  expect(value).not.toBeNull();
  return value as ToolResultRecord;
};

const firstTextContent = (result: ToolResultRecord): string => {
  const content = result.content;
  expect(Array.isArray(content)).toBe(true);
  const first = record((content as unknown[])[0]);
  expect(first.type).toBe("text");
  expect(first.text).toBeTypeOf("string");
  return first.text as string;
};

const ACME_BRAND_GUIDE = {
  brandGuide: {
    id: "acme",
    name: "Acme Brand Guide",
    description: "Reusable Acme presentation system for sales and strategy decks.",
  },
  brandKit: {
    colors: [],
    logo: {
      name: "Primary Logo",
      assetHandle: "LOGO",
      filename: "logo.svg",
      mimeType: "image/svg+xml" as const,
      description: "Use on light backgrounds.",
    },
    decorativeAssets: [
      {
        id: "wave-divider",
        name: "Wave Divider",
        assetHandle: "DECORATIVE_ASSET_WAVE_DIVIDER",
        filename: "wave-divider.svg",
        mimeType: "image/svg+xml" as const,
        description: "Use as a subtle section divider.",
      },
    ],
  },
  presentationKit: {
    canvas: { width: 1920, height: 1080, unit: "px" as const },
    designPrompt: null,
  },
};

describe("Onbrand MCP tools", () => {
  test("returns tool results with machine-readable structured content and matching text content", () => {
    const result = { brandGuides: [ACME_BRAND_GUIDE.brandGuide] };
    const toolResult = toToolResult(result);

    expect(toolResult.structuredContent).toBe(result);
    expect(
      JSON.parse(toolResult.content[0]?.type === "text" ? toolResult.content[0].text : "{}"),
    ).toEqual(result);
  });

  test("get_onbrand_skill exposes the skill as structured data and readable text", async () => {
    const client = await connectedClient(fakeBrandGuides());

    const result = await callTool(client, { name: "get_onbrand_skill", arguments: {} });
    const structuredContent = record(result.structuredContent);

    expect(structuredContent.skill).toBeTypeOf("string");
    expect(firstTextContent(result)).not.toHaveLength(0);
  });

  test("get_brand_guide returns the requested Brand Guide without resource links", async () => {
    const client = await connectedClient(fakeBrandGuides());

    const result = await callTool(client, {
      name: "get_brand_guide",
      arguments: { brandGuideId: "acme" },
    });

    expect(client.getServerCapabilities()?.resources).toBeUndefined();
    expect(result.structuredContent).toEqual(ACME_BRAND_GUIDE);
  });

  test("read-only credentials can call read tools but not mutating tools", async () => {
    const client = await connectedClient(fakeBrandGuides(), ["onbrand:read"]);

    const result = await callTool(client, { name: "list_brand_guides", arguments: {} });
    expect(result.structuredContent).toEqual({ brandGuides: [ACME_BRAND_GUIDE.brandGuide] });
    const writeResult = await callTool(client, {
      name: "write_brand_guide",
      arguments: {
        brandGuide: {
          id: "newco",
          name: "NewCo Brand Guide",
          description: "NewCo Brand Guide for crisp editorial business presentations.",
        },
        brandKit: {
          colors: [],
          logo: {
            assetId: "primary-logo",
            name: "Primary Logo",
            filename: "logo.svg",
            mimeType: "image/svg+xml",
            description: "Use on light backgrounds.",
            s3Key: "test-user/newco/primary-logo/logo.svg",
            byteSize: 7,
            sha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          },
          decorativeAssets: [],
        },
        presentationKit: {
          canvas: { width: 1280, height: 720, unit: "px" },
          designPrompt:
            "Use crisp editorial slide compositions with strong hierarchy, exact logo usage, accessible contrast, reusable color tokens, disciplined spacing, and action-oriented presentation copy across every generated slide.",
        },
      },
    });
    expect(writeResult.isError).toBe(true);
    expect(firstTextContent(writeResult)).toContain("onbrand:write");
  });

  test("get_brand_guide_writer_skill exposes the authoring skill as structured data and readable text", async () => {
    const client = await connectedClient(fakeBrandGuides());

    const result = await callTool(client, {
      name: "get_brand_guide_writer_skill",
      arguments: {},
    });
    const structuredContent = record(result.structuredContent);

    expect(structuredContent.writerSkill).toBeTypeOf("string");
    expect(firstTextContent(result)).not.toHaveLength(0);
  });

  test("prepare_brand_guide_asset_uploads delegates asset upload preparation without asset bytes", async () => {
    const client = await connectedClient(fakeBrandGuides());

    const result = await callTool(client, {
      name: "prepare_brand_guide_asset_uploads",
      arguments: {
        brandGuideId: "newco",
        uploads: [
          {
            assetId: "primary-logo",
            filename: "logo.svg",
            mimeType: "image/svg+xml",
            byteSize: 7,
            sha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          },
        ],
      },
    });

    const structuredContent = record(result.structuredContent);
    const uploads = structuredContent.uploads;
    expect(structuredContent.brandGuideId).toBe("newco");
    expect(Array.isArray(uploads)).toBe(true);
    expect(record((uploads as unknown[])[0]).method).toBe("PUT");
    expect(record((uploads as unknown[])[0]).uploadUrl).toBeTypeOf("string");
    expect(JSON.stringify(result)).not.toContain("contentBase64");
  });

  test("prepare_brand_guide_asset_uploads rejects consumer asset handles as upload ids", async () => {
    const client = await connectedClient(fakeBrandGuides());

    const result = await callTool(client, {
      name: "prepare_brand_guide_asset_uploads",
      arguments: {
        brandGuideId: "newco",
        uploads: [
          {
            assetId: "LOGO",
            filename: "logo.svg",
            mimeType: "image/svg+xml",
            byteSize: 7,
            sha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          },
        ],
      },
    });

    expect(result.isError).toBe(true);
    expect(firstTextContent(result)).toContain("assetId");
  });

  test("write_brand_guide persists a model-constructed Brand Guide without asset bytes", async () => {
    const client = await connectedClient(fakeBrandGuides());
    const request = {
      brandGuide: {
        id: "newco",
        name: "NewCo Brand Guide",
        description: "NewCo Brand Guide for crisp editorial business presentations.",
      },
      brandKit: {
        colors: [{ id: "ink", name: "Ink", value: "#111111", description: "Primary text." }],
        logo: {
          assetId: "primary-logo",
          name: "Primary Logo",
          filename: "logo.svg",
          mimeType: "image/svg+xml",
          description: "Use on light backgrounds.",
          s3Key: "test-user/newco/primary-logo/logo.svg",
          byteSize: 7,
          sha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        },
        decorativeAssets: [],
      },
      presentationKit: {
        canvas: { width: 1280, height: 720, unit: "px" as const },
        designPrompt:
          "Use crisp editorial slide compositions with strong hierarchy, exact logo usage, accessible contrast, reusable color tokens, disciplined spacing, and action-oriented presentation copy across every generated slide.",
      },
    };

    const result = await callTool(client, { name: "write_brand_guide", arguments: request });
    const structuredContent = record(result.structuredContent);
    const brandGuide = record(structuredContent.brandGuide);
    const brandKit = record(brandGuide.brandKit);
    const logo = record(brandKit.logo);

    expect(structuredContent.brandGuideId).toBe(request.brandGuide.id);
    expect(structuredContent.action).toBe("CREATED");
    expect(brandGuide.brandGuide).toEqual(request.brandGuide);
    expect(logo.assetHandle).toBe("LOGO");
    expect(logo.filename).toBe(request.brandKit.logo.filename);
    expect(logo.mimeType).toBe(request.brandKit.logo.mimeType);
    expect(logo).not.toHaveProperty("assetId");
    expect(logo).not.toHaveProperty("s3Key");
    expect(logo).not.toHaveProperty("byteSize");
    expect(logo).not.toHaveProperty("sha256");
    expect(brandGuide.presentationKit).toEqual(request.presentationKit);
    expect(JSON.stringify(result)).not.toContain("contentBase64");
  });

  test("materialize_brand_kit_assets returns download commands instead of asset bytes", async () => {
    const client = await connectedClient(fakeBrandGuides());

    const result = await callTool(client, {
      name: "materialize_brand_kit_assets",
      arguments: { brandGuideId: "acme", outputDirectory: "assets" },
    });
    const structuredContent = record(result.structuredContent);
    const commands = structuredContent.commands;
    const assets = structuredContent.assets;

    expect(structuredContent.brandGuideId).toBe("acme");
    expect(structuredContent.outputDirectory).toBe("assets");
    expect(Array.isArray(commands)).toBe(true);
    expect(
      (commands as unknown[]).some(
        (command) => typeof command === "string" && command.startsWith("curl "),
      ),
    ).toBe(true);
    expect(Array.isArray(assets)).toBe(true);
    expect(
      (assets as unknown[]).some((asset) => typeof record(asset).downloadUrl === "string"),
    ).toBe(true);
    expect(JSON.stringify(result)).not.toContain("contentBase64");
    expect(JSON.stringify(result)).not.toContain(Buffer.from("<svg />").toString("base64"));
  });
});

const connectedClient = async (
  brandGuides: BrandGuideApplicationService,
  scopes: readonly string[] = ["onbrand:read", "onbrand:write"],
): Promise<Client> => {
  const server = createOnbrandMcpServer(brandGuides, {
    ownerUserId: "test-user",
    scopes,
  });
  const client = new Client({ name: "test", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
};

const fakeBrandGuides = (): BrandGuideApplicationService => ({
  listBrandGuides: async () => [ACME_BRAND_GUIDE.brandGuide],
  getBrandGuide: async (_auth, id) => {
    if (id !== "acme") throw new Error("Unknown Brand Guide");
    return ACME_BRAND_GUIDE;
  },
  createBrandGuide: async (_auth, request) => ({
    brandGuide: { id: "newco", name: request.name, description: request.description ?? null },
    brandKit: { colors: [], logo: null, decorativeAssets: [] },
    presentationKit: { canvas: null, designPrompt: null },
  }),
  createBrandGuideGenerationRequest: async (_auth, request) => ({
    id: "generation-request",
    sourceUrl: request.sourceUrl,
    status: "COMPLETED",
    brandGuide: {
      id: "newco",
      name: "newco.example Brand Guide",
      description: `Brand Guide being created from ${request.sourceUrl}.`,
    },
    errorMessage: null,
    createdAt: "2026-06-23T12:00:00.000Z",
    updatedAt: "2026-06-23T12:00:00.000Z",
  }),
  updateBrandGuideMetadata: async () => ACME_BRAND_GUIDE,
  deleteBrandGuide: async () => undefined,
  upsertColorToken: async () => ACME_BRAND_GUIDE,
  deleteColorToken: async () => ACME_BRAND_GUIDE,
  upsertLogo: async () => ACME_BRAND_GUIDE,
  deleteLogo: async () => ACME_BRAND_GUIDE,
  upsertDecorativeAsset: async () => ACME_BRAND_GUIDE,
  deleteDecorativeAsset: async () => ACME_BRAND_GUIDE,
  updatePresentationKit: async () => ACME_BRAND_GUIDE,
  prepareBrandGuideAssetUploads: async (auth, request) => ({
    brandGuideId: request.brandGuideId,
    instructions:
      "Run each PUT command from the directory containing the exact asset file. Then call write_brand_guide with the returned s3Key, byteSize, and sha256 metadata. Do not send asset bytes through MCP.",
    uploads: request.uploads.map((upload) => ({
      ...upload,
      s3Key: `${auth.ownerUserId}/${request.brandGuideId}/${upload.assetId}/${upload.filename}`,
      uploadUrl: `https://s3.example/upload/${upload.filename}?signature=test`,
      expiresInSeconds: 900,
      method: "PUT" as const,
      headers: { "Content-Type": upload.mimeType },
      command: "curl -fsSL -X PUT ...",
    })),
  }),
  getBrandKitAssetPreviewUrl: async () => "https://s3.example/logo.svg?signature=test",
  writeBrandGuide: async (_auth, request) => ({
    brandGuideId: request.brandGuide.id,
    action: "CREATED",
    brandGuide: {
      brandGuide: request.brandGuide,
      brandKit: {
        colors: request.brandKit.colors,
        logo: {
          name: request.brandKit.logo.name,
          assetHandle: "LOGO",
          filename: request.brandKit.logo.filename,
          mimeType: request.brandKit.logo.mimeType,
          description: request.brandKit.logo.description,
        },
        decorativeAssets: [],
      },
      presentationKit: request.presentationKit,
    },
  }),
  materializeBrandKitAssets: async (_auth, { brandGuideId, outputDirectory }) => ({
    brandGuideId,
    outputDirectory,
    expiresInSeconds: 900,
    instructions:
      "Run the commands in the user's workspace to download exact Brand Kit files from short-lived S3 URLs. Do not paste, decode, or rewrite asset bytes manually from the MCP response.",
    commands: [
      "mkdir -p 'assets'",
      "curl -fsSL 'https://s3.example/logo.svg?signature=test' -o 'assets/logo.svg'",
    ],
    assets: [
      {
        kind: "LOGO",
        assetHandle: "LOGO",
        name: "Primary Logo",
        filename: "logo.svg",
        mimeType: "image/svg+xml",
        downloadUrl: "https://s3.example/logo.svg?signature=test",
        targetPath: "assets/logo.svg",
        relativePath: "assets/logo.svg",
      },
    ],
  }),
});
