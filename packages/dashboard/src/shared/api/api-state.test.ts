import { afterEach, describe, expect, it, vi } from "vitest";

import { sendJson } from "./api-state";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("dashboard API auth recovery", () => {
  it("rechecks /api/me and retries the original request before redirecting on 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ownerUserId: "owner-123", scopes: ["onbrand:write"] }), {
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ saved: true }), {
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", {
      location: { pathname: "/brand-guides/brand-123", href: "" },
    });

    await expect(
      sendJson<{ saved: boolean }>("/api/brand-guides/brand-123/metadata", {
        method: "PATCH",
        body: { name: "Acme" },
      }),
    ).resolves.toEqual({ saved: true });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/me",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/brand-guides/brand-123/metadata",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(window.location.href).toBe("");
  });

  it("redirects to login only after the recovery probes stay unauthenticated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Unauthorized", { status: 401 })),
    );
    vi.stubGlobal("window", {
      location: { pathname: "/brand-guides/brand-123", href: "" },
    });

    void sendJson("/api/brand-guides/brand-123/metadata", {
      method: "PATCH",
      body: { name: "Acme" },
    });

    await vi.waitFor(() => {
      expect(window.location.href).toBe("/login?returnTo=%2Fbrand-guides%2Fbrand-123");
    });
  });
});
