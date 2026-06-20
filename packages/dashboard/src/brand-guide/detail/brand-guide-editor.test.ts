import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  BrandGuideView,
  PreparedBrandGuideAssetUpload,
} from "@onbrand/core/brand-guide/application-service";

import { BrandGuideEditor, optimisticMetadataView } from "./brand-guide-editor";
import { sendJson } from "../../shared/api/api-state";

const baseView = (id = "brand guide/1"): BrandGuideView => ({
  brandGuide: {
    id,
    name: "Acme",
    description: null,
  },
  brandKit: {
    colors: [],
    logo: null,
    decorativeAssets: [],
  },
  presentationKit: {
    canvas: null,
    designPrompt: null,
  },
});

const upload = (
  overrides: Partial<PreparedBrandGuideAssetUpload> = {},
): PreparedBrandGuideAssetUpload => ({
  assetId: "logo",
  filename: "logo.svg",
  mimeType: "image/svg+xml",
  byteSize: 123,
  sha256: "abc123",
  s3Key: "brand-kit-assets/owner/acme/logo/logo.svg",
  uploadUrl: "https://s3.example/upload",
  expiresInSeconds: 300,
  method: "PUT",
  headers: { "Content-Type": "image/svg+xml" },
  command: "curl -X PUT",
  ...overrides,
});

const file = (name: string, type: string): File => ({ name, type }) as File;

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
};

const createEditor = (view = baseView()) => {
  const send = vi.fn(async <T>() => view as T);
  const uploadAsset = vi.fn(async () => upload());
  const notify = {
    success: vi.fn(),
    error: vi.fn(),
  };
  const publishBrandGuide = vi.fn();
  const editor = new BrandGuideEditor("brand guide/1", {
    sendJson: send as never,
    uploadAsset,
    notify,
    publishBrandGuide,
    scheduler: globalThis,
  });
  return { editor, send, uploadAsset, notify, publishBrandGuide };
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("BrandGuideEditor", () => {
  it("marks slower Brand Guide view replacements as stale when a newer save starts", async () => {
    const firstSave = deferred<BrandGuideView>();
    const newerView: BrandGuideView = {
      ...baseView(),
      brandKit: {
        ...baseView().brandKit,
        colors: [{ id: "primary", name: "Primary", value: "#0050BD", description: "" }],
      },
    };
    const send = vi
      .fn()
      .mockImplementationOnce(() => firstSave.promise)
      .mockResolvedValueOnce(newerView);
    const notify = { success: vi.fn(), error: vi.fn() };
    const editor = new BrandGuideEditor("brand guide/1", {
      sendJson: send as never,
      uploadAsset: vi.fn(async () => upload()),
      notify,
      publishBrandGuide: vi.fn(),
      scheduler: globalThis,
    });

    const first = editor.saveColorToken({
      name: "Primary",
      value: "#0050BD",
      description: "First request",
    });
    const second = editor.saveColorToken({
      name: "Accent",
      value: "#FFAA00",
      description: "Second request",
    });

    await expect(second).resolves.toMatchObject({ view: newerView, stale: false });
    firstSave.resolve(baseView());
    await expect(first).resolves.toMatchObject({ view: baseView(), stale: true });
    expect(notify.success).toHaveBeenCalledTimes(1);
  });

  it("treats asset upload and declaration save as one ordered Brand Guide edit", async () => {
    const logoUpload = deferred<PreparedBrandGuideAssetUpload>();
    const send = vi.fn(async <T>() => baseView() as T);
    const uploadAsset = vi
      .fn()
      .mockImplementationOnce(() => logoUpload.promise)
      .mockResolvedValueOnce(upload({ assetId: "Hero Orb", filename: "orb.webp" }));
    const notify = { success: vi.fn(), error: vi.fn() };
    const editor = new BrandGuideEditor("brand guide/1", {
      sendJson: send as never,
      uploadAsset,
      notify,
      publishBrandGuide: vi.fn(),
      scheduler: globalThis,
    });

    const staleLogoSave = editor.saveLogo({
      filename: "logo.svg",
      mimeType: "image/svg+xml",
      description: "Old logo",
      upload: { file: file("logo.svg", "image/svg+xml") },
    });
    const latestAssetSave = editor.saveDecorativeAsset({
      name: "Hero Orb",
      filename: "orb.webp",
      mimeType: "image/webp",
      description: "Background accent",
      upload: { file: file("orb.webp", "image/webp") },
    });

    await expect(latestAssetSave).resolves.toMatchObject({ stale: false });
    logoUpload.resolve(upload());
    await expect(staleLogoSave).resolves.toMatchObject({ stale: true });
    expect(notify.success).toHaveBeenCalledTimes(1);
  });

  it("debounces scheduled saves onto the editor seam", async () => {
    vi.useFakeTimers();
    const { editor } = createEditor();
    const save = vi.fn(async () => undefined);
    const debounced = editor.debounce(save, { delayMs: 650, errorLabel: "Color Token" });

    debounced.schedule();
    debounced.schedule();
    await vi.advanceTimersByTimeAsync(649);
    expect(save).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("uploads a Logo file before saving the Logo declaration", async () => {
    const { editor, send, uploadAsset, notify } = createEditor();
    const logoFile = file("logo.svg", "image/svg+xml");

    await editor.saveLogo({
      filename: logoFile.name,
      mimeType: logoFile.type,
      description: "Use on light backgrounds",
      upload: { file: logoFile },
    });

    expect(uploadAsset).toHaveBeenCalledWith("brand guide/1", "logo", logoFile);
    expect(send).toHaveBeenCalledWith("/api/brand-guides/brand%20guide%2F1/logo", {
      method: "PUT",
      body: {
        filename: "logo.svg",
        mimeType: "image/svg+xml",
        description: "Use on light backgrounds",
        s3Key: "brand-kit-assets/owner/acme/logo/logo.svg",
        byteSize: 123,
        sha256: "abc123",
      },
    });
    expect(notify.success).toHaveBeenCalledWith("Changes saved");
  });

  it("saves Decorative Asset renames with the previous name and uploaded file metadata", async () => {
    const { editor, send, uploadAsset } = createEditor();
    const assetFile = file("orb.webp", "image/webp");
    uploadAsset.mockResolvedValueOnce(
      upload({
        assetId: "Hero Orb",
        filename: "orb.webp",
        mimeType: "image/webp",
        s3Key: "brand-kit-assets/owner/acme/hero-orb/orb.webp",
      }),
    );

    await editor.saveDecorativeAsset({
      previousName: "Hero Circle",
      name: "Hero Orb",
      filename: assetFile.name,
      mimeType: assetFile.type,
      description: "Background accent",
      upload: { file: assetFile },
    });

    expect(uploadAsset).toHaveBeenCalledWith("brand guide/1", "Hero Orb", assetFile);
    expect(send).toHaveBeenCalledWith("/api/brand-guides/brand%20guide%2F1/decorative-assets", {
      method: "PUT",
      body: {
        previousName: "Hero Circle",
        asset: {
          name: "Hero Orb",
          filename: "orb.webp",
          mimeType: "image/webp",
          description: "Background accent",
          s3Key: "brand-kit-assets/owner/acme/hero-orb/orb.webp",
          byteSize: 123,
          sha256: "abc123",
        },
      },
    });
  });

  it("reports Color Token duplicate errors through the shared toast policy", async () => {
    const { editor, send, notify } = createEditor();
    send.mockRejectedValueOnce(new Error("Duplicate Color Token name: Blue"));

    await expect(
      editor.saveColorToken({
        previousName: "Sky",
        name: "Blue",
        value: "#0050BD",
        description: "",
      }),
    ).rejects.toThrow("Duplicate Color Token name: Blue");

    expect(notify.error).toHaveBeenCalledWith("Could not save Color Token", {
      description: "Duplicate Color Token name: Blue",
    });
  });

  it("reports Presentation Kit save failures through the shared toast policy", async () => {
    const { editor, send, notify, publishBrandGuide } = createEditor();
    send.mockRejectedValueOnce(new Error("Network unavailable"));
    const presentationKit = {
      canvas: { width: 1280, height: 720, unit: "px" as const },
      designPrompt: "Use the launch narrative.",
    };

    await expect(editor.savePresentationKit(presentationKit)).rejects.toThrow(
      "Network unavailable",
    );

    expect(send).toHaveBeenCalledWith("/api/brand-guides/brand%20guide%2F1/presentation-kit", {
      method: "PATCH",
      body: presentationKit,
    });
    expect(notify.error).toHaveBeenCalledWith("Could not save Presentation Kit", {
      description: "Network unavailable",
    });
    expect(notify.success).not.toHaveBeenCalled();
    expect(publishBrandGuide).not.toHaveBeenCalled();
  });

  it("keeps delete endpoint paths inside the editor", async () => {
    const { editor, send } = createEditor();

    await editor.deleteLogo();
    await editor.deleteDecorativeAsset("Hero Orb");
    await editor.deleteColorToken("Primary Blue");

    expect(send).toHaveBeenNthCalledWith(1, "/api/brand-guides/brand%20guide%2F1/logo", {
      method: "DELETE",
    });
    expect(send).toHaveBeenNthCalledWith(
      2,
      "/api/brand-guides/brand%20guide%2F1/decorative-assets/Hero%20Orb",
      { method: "DELETE" },
    );
    expect(send).toHaveBeenNthCalledWith(
      3,
      "/api/brand-guides/brand%20guide%2F1/colors/Primary%20Blue",
      { method: "DELETE" },
    );
  });

  it("publishes saved Brand Guide metadata after an optimistic local view update", async () => {
    const saved = baseView();
    const { editor, publishBrandGuide } = createEditor(saved);
    const optimistic = optimisticMetadataView(baseView(), { name: "Acme Studio", description: "" });

    expect(optimistic.brandGuide).toMatchObject({ name: "Acme Studio", description: null });

    await editor.saveMetadata({ name: "Acme Studio", description: "" });
    expect(publishBrandGuide).toHaveBeenCalledWith(saved.brandGuide);
  });

  it("leaves 401 redirects to the shared fetch helper", async () => {
    const fetchMock = vi.fn(async () => new Response("Unauthorized", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", {
      location: { pathname: "/brand-guides/brand%20guide%2F1/colors", href: "" },
    });

    void sendJson("/api/brand-guides/brand%20guide%2F1/colors", {
      method: "PUT",
      body: { name: "Blue" },
    });

    await vi.waitFor(() => {
      expect(window.location.href).toBe(
        "/login?returnTo=%2Fbrand-guides%2Fbrand%2520guide%252F1%2Fcolors",
      );
    });
  });
});
