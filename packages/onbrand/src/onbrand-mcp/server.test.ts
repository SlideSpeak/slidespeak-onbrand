import { describe, expect, test } from "vitest";
import { type DesignSystemRegistry } from "../design-system/registry/registry";
import { createOnbrandMcpServer, toToolResult } from "./server";

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

  test("exposes full Design System and Presentation Conformance tools without Brand Kit-only retrieval", () => {
    const server = createOnbrandMcpServer(registryStub());
    const tools = (server as unknown as { _registeredTools: Record<string, unknown> })
      ._registeredTools;
    const prompts = (server as unknown as { _registeredPrompts: Record<string, unknown> })
      ._registeredPrompts;
    const underlyingServer = server.server as unknown as { _instructions?: string };

    expect(Object.keys(tools).sort()).toEqual([
      "check_presentation_conformance",
      "get_design_system",
      "list_design_systems",
    ]);
    expect(Object.keys(prompts)).toEqual([]);
    expect(underlyingServer._instructions).toBeUndefined();
  });
});

const registryStub = (): DesignSystemRegistry => ({
  listDesignSystems: () => [{ id: "acme", name: "Acme Design System" }],
  getDesignSystem: () => ({
    designSystem: { id: "acme", name: "Acme Design System" },
    brandKit: { colors: [], logo: { name: "Logo", source: "./logo.svg", description: "Logo." } },
    presentationKit: { canvas: { width: 1920, height: 1080, unit: "px" }, persistentElements: [] },
  }),
});
