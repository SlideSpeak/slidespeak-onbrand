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

  test("returns Brand Kit asset files as HTTPS-safe base64 payloads", async () => {
    const client = await connectedClient(fakeRegistry());

    const result = await client.callTool({
      name: "get_brand_kit_asset_files",
      arguments: {
        designSystemId: "acme",
        assetHandles: ["LOGO"],
      },
    });

    const expected = {
      designSystemId: "acme",
      assets: [
        {
          kind: "LOGO",
          assetHandle: "LOGO",
          name: "Primary Logo",
          filename: "logo.svg",
          mimeType: "image/svg+xml",
          contentBase64: Buffer.from("<svg />").toString("base64"),
        },
      ],
    };
    expect(result.structuredContent).toEqual(expected);
    expect(result.content).toEqual([{ type: "text", text: JSON.stringify(expected) }]);
    expect(JSON.stringify(result)).not.toContain("/app/");
    expect(JSON.stringify(result)).not.toContain("onbrand-mcp-workspace");
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
  getBrandKitAssetFiles: async (_auth, { designSystemId }) => ({
    designSystemId,
    assets: [
      {
        kind: "LOGO",
        assetHandle: "LOGO",
        name: "Primary Logo",
        filename: "logo.svg",
        mimeType: "image/svg+xml",
        contentBase64: Buffer.from("<svg />").toString("base64"),
      },
    ],
  }),
});
