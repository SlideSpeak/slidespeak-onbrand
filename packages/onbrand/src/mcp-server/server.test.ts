import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, test } from "vitest";
import type { DesignSystemRegistry } from "../design-system/registry/registry";
import { createOnbrandMcpServer, toToolResult } from "./server";

const ACME_DESIGN_SYSTEM = {
  designSystem: { id: "acme", name: "Acme Design System" },
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
      designSystems: [{ id: "acme", name: "Acme Design System" }],
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
  listDesignSystems: async () => [{ id: "acme", name: "Acme Design System" }],
  getDesignSystem: async (_auth, id) => {
    if (id !== "acme") throw new Error("Unknown Design System");
    return ACME_DESIGN_SYSTEM;
  },
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
