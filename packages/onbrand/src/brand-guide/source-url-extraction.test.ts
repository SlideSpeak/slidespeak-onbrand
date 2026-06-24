import { lookup } from "node:dns/promises";
import { extractBrandAssets } from "openbrand";
import { describe, expect, it, vi } from "vitest";
import { extractBrandGuideSource } from "./source-url-extraction";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(),
}));

vi.mock("openbrand", () => ({
  extractBrandAssets: vi.fn(),
}));

describe("extractBrandGuideSource", () => {
  it("does not fetch extracted asset URLs that resolve to private addresses", async () => {
    const lookupMock = lookup as unknown as ReturnType<typeof vi.fn>;
    const extractBrandAssetsMock = extractBrandAssets as unknown as ReturnType<typeof vi.fn>;
    lookupMock
      .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
      .mockResolvedValue([{ address: "169.254.169.254", family: 4 }]);
    extractBrandAssetsMock.mockResolvedValueOnce({
      ok: true,
      data: {
        brand_name: "Example",
        colors: [],
        logos: [{ url: "https://metadata.example/latest/meta-data" }],
        backdrop_images: [],
      },
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await extractBrandGuideSource("https://example.com");

    expect(result.logo).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("validates redirected asset targets before following them", async () => {
    const lookupMock = lookup as unknown as ReturnType<typeof vi.fn>;
    const extractBrandAssetsMock = extractBrandAssets as unknown as ReturnType<typeof vi.fn>;
    lookupMock
      .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
      .mockResolvedValueOnce([{ address: "93.184.216.35", family: 4 }])
      .mockResolvedValueOnce([{ address: "10.0.0.1", family: 4 }]);
    extractBrandAssetsMock.mockResolvedValueOnce({
      ok: true,
      data: {
        brand_name: "Example",
        colors: [],
        logos: [{ url: "https://cdn.example/logo.svg" }],
        backdrop_images: [],
      },
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: "http://internal.example/logo.svg" },
      }),
    );

    const result = await extractBrandGuideSource("https://example.com");

    expect(result.logo).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
