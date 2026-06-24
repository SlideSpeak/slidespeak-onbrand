import { lookup } from "node:dns/promises";
import { describe, expect, it, vi } from "vitest";
import { assertPublicOutboundUrl, normalizePublicHttpUrl } from "./source-url-security";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(),
}));

describe("source URL security", () => {
  it("normalizes public HTTP URLs without credentials or fragments", () => {
    const url = normalizePublicHttpUrl("example.com/path#section");

    expect(url?.toString()).toBe("https://example.com/path");
  });

  it("rejects private literal IP addresses", async () => {
    const url = normalizePublicHttpUrl("http://10.0.0.1/logo.svg");

    expect(url).not.toBeNull();
    await expect(assertPublicOutboundUrl(url as URL)).rejects.toThrow("Outbound URL is not public");
  });

  it("rejects hostnames that resolve to private addresses", async () => {
    const lookupMock = lookup as unknown as ReturnType<typeof vi.fn>;
    lookupMock.mockResolvedValueOnce([
      { address: "93.184.216.34", family: 4 },
      { address: "169.254.169.254", family: 4 },
    ]);

    await expect(
      assertPublicOutboundUrl(new URL("https://assets.example/logo.svg")),
    ).rejects.toThrow("Outbound URL is not public");
  });
});
