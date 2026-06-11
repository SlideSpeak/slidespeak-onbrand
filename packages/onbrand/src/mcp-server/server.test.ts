import { describe, expect, test } from "vitest";
import { toToolResult } from "./server";

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

});
