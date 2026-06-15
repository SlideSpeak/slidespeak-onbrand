import { describe, expect, it } from "vitest";
import { normalizeOutputDirectory } from "./workflow";

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
