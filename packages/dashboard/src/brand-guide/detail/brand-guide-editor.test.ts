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

  it("tracks Color Token previous names across autosaved renames", async () => {
    vi.useFakeTimers();
    const { editor, send } = createEditor();
    const onSaved = vi.fn();
    const draftSave = editor.createColorTokenDraftSave(
      { name: "Sky", value: "#67A8FF", description: "Soft blue" },
      { onSaved },
    );

    draftSave.update({ name: "Blue", value: "#0050bd", description: "Primary" });
    await vi.advanceTimersByTimeAsync(650);
    draftSave.update({ name: "Core Blue", value: "#0050BD", description: "Primary" });
    await vi.advanceTimersByTimeAsync(650);

    expect(send).toHaveBeenNthCalledWith(1, "/api/brand-guides/brand%20guide%2F1/colors", {
      method: "PUT",
      body: {
        previousName: "Sky",
        name: "Blue",
        value: "#0050BD",
        description: "Primary",
      },
    });
    expect(send).toHaveBeenNthCalledWith(2, "/api/brand-guides/brand%20guide%2F1/colors", {
      method: "PUT",
      body: {
        previousName: "Blue",
        name: "Core Blue",
        value: "#0050BD",
        description: "Primary",
      },
    });
    expect(onSaved).toHaveBeenCalledTimes(2);
  });

  it("cancels debounced Logo metadata saves so file uploads can own the saved declaration", async () => {
    vi.useFakeTimers();
    const { editor, send } = createEditor();
    const draftSave = editor.createLogoDescriptionDraftSave(
      {
        name: "Logo",
        assetHandle: "asset:logo",
        filename: "logo.svg",
        mimeType: "image/svg+xml",
        description: "Old",
      },
      { onSaved: vi.fn() },
    );

    draftSave.update({ description: "Pending metadata" });
    draftSave.cancel();
    await editor.saveLogo({
      filename: "logo.png",
      mimeType: "image/png",
      description: "Uploaded metadata",
      upload: { file: file("logo.png", "image/png") },
    });
    await vi.advanceTimersByTimeAsync(650);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith("/api/brand-guides/brand%20guide%2F1/logo", {
      method: "PUT",
      body: {
        filename: "logo.svg",
        mimeType: "image/svg+xml",
        description: "Uploaded metadata",
        s3Key: "brand-kit-assets/owner/acme/logo/logo.svg",
        byteSize: 123,
        sha256: "abc123",
      },
    });
  });

  it("debounces Presentation Kit drafts behind the editor interface", async () => {
    vi.useFakeTimers();
    const { editor, send, publishBrandGuide } = createEditor();
    const onSaved = vi.fn();
    const draftSave = editor.createPresentationKitDraftSave(
      { canvas: null, designPrompt: null },
      { onSaved },
    );

    draftSave.update({
      canvas: { width: 1280, height: 720, unit: "px" },
      designPrompt: "Use minimal layouts.",
    });
    draftSave.update({
      canvas: { width: 1920, height: 1080, unit: "px" },
      designPrompt: "Use minimal layouts.",
    });
    await vi.advanceTimersByTimeAsync(649);
    expect(send).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith("/api/brand-guides/brand%20guide%2F1/presentation-kit", {
      method: "PATCH",
      body: {
        canvas: { width: 1920, height: 1080, unit: "px" },
        designPrompt: "Use minimal layouts.",
      },
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(publishBrandGuide).toHaveBeenCalledWith(baseView().brandGuide);
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
