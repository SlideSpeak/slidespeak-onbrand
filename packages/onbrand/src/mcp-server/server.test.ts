import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, test } from "vitest";
import type { DesignSystemRegistry } from "../design-system/registry/registry";
import { createOnbrandMcpServer, toToolResult } from "./server";

const ACME_DESIGN_SYSTEM = {
  designSystem: {
    id: "acme",
    name: "Acme Design System",
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
  presentationKit: { canvas: { width: 1920, height: 1080, unit: "px" as const } },
};

describe("Onbrand MCP tools", () => {
  test("serializes structured content as matching JSON text", () => {
    const result = {
      designSystems: [
        {
          id: "acme",
          name: "Acme Design System",
          description: "Reusable Acme presentation system for sales and strategy decks.",
        },
      ],
    };

    expect(toToolResult(result)).toEqual({
      structuredContent: result,
      content: [{ type: "text", text: JSON.stringify(result) }],
    });
  });

  test("get_design_system returns selected Design System metadata without resource links", async () => {
    const registry = fakeRegistry();
    const client = await connectedClient(registry);

    const result = await client.callTool({
      name: "get_design_system",
      arguments: { designSystemId: "acme" },
    });

    expect(client.getServerCapabilities()?.resources).toBeUndefined();
    expect(result.structuredContent).toEqual(ACME_DESIGN_SYSTEM);
    expect(result.content).toEqual([{ type: "text", text: JSON.stringify(ACME_DESIGN_SYSTEM) }]);
  });

  test("get_design_system_writer_prompt exposes the authoring rubric", async () => {
    const client = await connectedClient(fakeRegistry());

    const result = await client.callTool({
      name: "get_design_system_writer_prompt",
      arguments: {},
    });

    expect(JSON.stringify(result.structuredContent)).toContain("Design System Writer Prompt");
    expect(JSON.stringify(result.structuredContent)).toContain("SKYLEAGUE");
    expect(JSON.stringify(result.structuredContent)).toContain("NON-NEGOTIABLE ASSET HANDOFF");
    expect(JSON.stringify(result.structuredContent)).toContain("Hard gate");
    expect(JSON.stringify(result.structuredContent)).toContain("rendered sample validation");
    expect(result.content).toEqual([
      { type: "text", text: JSON.stringify(result.structuredContent) },
    ]);
  });

  test("prepare_design_system_asset_uploads returns direct-to-S3 PUT commands", async () => {
    const client = await connectedClient(fakeRegistry());

    const result = await client.callTool({
      name: "prepare_design_system_asset_uploads",
      arguments: {
        designSystemId: "newco",
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

    expect(result.structuredContent).toEqual({
      designSystemId: "newco",
      instructions:
        "Run each PUT command from the directory containing the exact asset file. Then call write_design_system with the returned s3Key, byteSize, and sha256 metadata. Do not send asset bytes through MCP.",
      uploads: [
        expect.objectContaining({
          method: "PUT",
          s3Key: "test-user/newco/primary-logo/logo.svg",
          uploadUrl: "https://s3.example/upload/logo.svg?signature=test",
        }),
      ],
    });
  });

  test("write_design_system persists a model-constructed Design System", async () => {
    const client = await connectedClient(fakeRegistry());
    const request = {
      designSystem: {
        id: "newco",
        name: "NewCo Design System",
        description: "NewCo Design System for crisp editorial business presentations.",
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

    const result = await client.callTool({ name: "write_design_system", arguments: request });

    expect(result.structuredContent).toEqual({
      designSystemId: "newco",
      action: "created",
      designSystem: {
        ...request,
        brandKit: {
          colors: request.brandKit.colors,
          logo: {
            name: "Primary Logo",
            assetHandle: "LOGO",
            filename: "logo.svg",
            mimeType: "image/svg+xml",
            description: "Use on light backgrounds.",
          },
          decorativeAssets: [],
        },
      },
    });
    expect(JSON.stringify(result)).not.toContain("contentBase64");
  });

  test("returns S3 download commands instead of asset bytes", async () => {
    const client = await connectedClient(fakeRegistry());

    const result = await client.callTool({
      name: "materialize_brand_kit_assets",
      arguments: {
        designSystemId: "acme",
        outputDirectory: "assets",
        assetHandles: ["LOGO"],
      },
    });

    const expected = {
      designSystemId: "acme",
      outputDirectory: "assets",
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
    };
    expect(result.structuredContent).toEqual(expected);
    expect(result.content).toEqual([
      { type: "text", text: JSON.stringify(result.structuredContent) },
    ]);
    expect(JSON.stringify(result)).not.toContain("contentBase64");
    expect(JSON.stringify(result)).not.toContain(Buffer.from("<svg />").toString("base64"));
  });
});

const connectedClient = async (registry: DesignSystemRegistry): Promise<Client> => {
  const server = createOnbrandMcpServer(registry, {
    ownerUserId: "test-user",
    scopes: ["onbrand:read", "onbrand:write"],
  });
  const client = new Client({ name: "test", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
};

const fakeRegistry = (): DesignSystemRegistry => ({
  listDesignSystems: async () => [
    {
      id: "acme",
      name: "Acme Design System",
      description: "Reusable Acme presentation system for sales and strategy decks.",
    },
  ],
  getDesignSystem: async (_auth, id) => {
    if (id !== "acme") throw new Error("Unknown Design System");
    return ACME_DESIGN_SYSTEM;
  },
  prepareDesignSystemAssetUploads: async (auth, request) => ({
    designSystemId: request.designSystemId,
    instructions:
      "Run each PUT command from the directory containing the exact asset file. Then call write_design_system with the returned s3Key, byteSize, and sha256 metadata. Do not send asset bytes through MCP.",
    uploads: request.uploads.map((upload) => ({
      ...upload,
      s3Key: `${auth.ownerUserId}/${request.designSystemId}/${upload.assetId}/${upload.filename}`,
      uploadUrl: `https://s3.example/upload/${upload.filename}?signature=test`,
      expiresInSeconds: 900,
      method: "PUT" as const,
      headers: {
        "Content-Type": upload.mimeType,
      },
      command: "curl -fsSL -X PUT ...",
    })),
  }),
  writeDesignSystem: async (_auth, request) => ({
    designSystemId: request.designSystem.id,
    action: "created",
    designSystem: {
      designSystem: request.designSystem,
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
  materializeBrandKitAssets: async (_auth, { designSystemId, outputDirectory }) => ({
    designSystemId,
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
