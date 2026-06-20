import { toast } from "sonner";
import type {
  BrandGuideView,
  BrandKitDecorativeAsset,
  BrandKitVisualAsset,
  PreparedBrandGuideAssetUpload,
  PresentationKitView,
} from "@onbrand/core/brand-guide/application-service";

import { sendJson } from "../../shared/api/api-state";
import { publishBrandGuideUpdated } from "../../shared/brand-guide-sync";
import { uploadBrandGuideAsset } from "./asset-upload";

type SaveMethod = "PATCH" | "PUT" | "DELETE";

type SendJson = <T>(
  path: string,
  options: Readonly<{ method: SaveMethod; body?: unknown }>,
) => Promise<T>;

type UploadAsset = (
  brandGuideId: string,
  assetId: string,
  file: File,
) => Promise<PreparedBrandGuideAssetUpload>;

type Scheduler = Readonly<{
  setTimeout: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  clearTimeout: (handle: ReturnType<typeof setTimeout>) => void;
}>;

type Notifier = Readonly<{
  success: (message: string) => void;
  error: (message: string, options?: Readonly<{ description: string }>) => void;
}>;

type PublishBrandGuide = (brandGuide: BrandGuideView["brandGuide"]) => void;

type BrandGuideEditorDependencies = Readonly<{
  sendJson: SendJson;
  uploadAsset: UploadAsset;
  notify: Notifier;
  publishBrandGuide: PublishBrandGuide;
  scheduler: Scheduler;
}>;

export type SaveColorTokenRequest = Readonly<{
  previousName?: string;
  name: string;
  value: string;
  description: string;
}>;

export type SaveDecorativeAssetRequest = Readonly<{
  previousName?: string;
  name: string;
  filename: string;
  mimeType: string;
  description: string;
  upload?: Readonly<{ file: File; assetId?: string }>;
  storedFile?: Readonly<Pick<BrandKitDecorativeAsset, "filename" | "mimeType">>;
}>;

export type SaveLogoRequest = Readonly<{
  filename: string;
  mimeType: string;
  description: string;
  upload?: Readonly<{ file: File }>;
  storedFile?: Readonly<Pick<BrandKitVisualAsset, "filename" | "mimeType">>;
}>;

export type OrderedSaveResult = Readonly<{ view: BrandGuideView; stale: boolean }>;

export type DebouncedSave = Readonly<{
  schedule: () => void;
  cancel: () => void;
}>;

export class BrandGuideEditor {
  readonly #deps: BrandGuideEditorDependencies;
  readonly #brandGuideId: string;
  readonly #basePath: string;
  #nextSaveSequence = 0;
  #latestStartedSaveSequence = 0;

  constructor(brandGuideId: string, deps: BrandGuideEditorDependencies = defaultDependencies()) {
    this.#brandGuideId = brandGuideId;
    this.#deps = deps;
    this.#basePath = `/api/brand-guides/${encodeURIComponent(brandGuideId)}`;
  }

  async saveMetadata(
    metadata: Readonly<{ name: string; description: string }>,
  ): Promise<OrderedSaveResult> {
    const save = this.#startSave();
    try {
      const view = await this.#save<BrandGuideView>(`${this.#basePath}/metadata`, {
        method: "PATCH",
        body: { name: metadata.name, description: nullableText(metadata.description) },
      });
      if (!save.stale()) this.#deps.publishBrandGuide(view.brandGuide);
      return { view, stale: save.stale() };
    } catch (error) {
      if (!save.stale())
        this.#deps.notify.error("Could not save Brand Guide metadata", {
          description: errorMessage(error),
        });
      throw error;
    }
  }

  async savePresentationKit(presentationKit: PresentationKitView): Promise<OrderedSaveResult> {
    const result = await this.#saveWithToast(
      "Presentation Kit",
      `${this.#basePath}/presentation-kit`,
      {
        method: "PATCH",
        body: presentationKit,
      },
    );
    if (!result.stale) this.#deps.publishBrandGuide(result.view.brandGuide);
    return result;
  }

  async saveColorToken(request: SaveColorTokenRequest): Promise<OrderedSaveResult> {
    return this.#saveWithToast("Color Token", `${this.#basePath}/colors`, {
      method: "PUT",
      body: {
        previousName: request.previousName,
        name: request.name,
        value: request.value,
        description: nullableText(request.description),
      },
    });
  }

  async deleteColorToken(name: string): Promise<OrderedSaveResult> {
    return this.#saveWithToast(
      "Color Token",
      `${this.#basePath}/colors/${encodeURIComponent(name)}`,
      { method: "DELETE" },
      "delete",
    );
  }

  async saveLogo(request: SaveLogoRequest): Promise<OrderedSaveResult> {
    return this.#saveWithToast("Logo", async () => {
      const file = request.upload
        ? await this.#deps.uploadAsset(this.#brandGuideId, "logo", request.upload.file)
        : null;
      const storedFile = request.storedFile ?? request;
      return this.#save<BrandGuideView>(`${this.#basePath}/logo`, {
        method: "PUT",
        body: {
          filename: file?.filename ?? storedFile.filename,
          mimeType: file?.mimeType ?? storedFile.mimeType,
          description: nullableText(request.description),
          s3Key: file?.s3Key ?? "",
          byteSize: file?.byteSize ?? 0,
          sha256: file?.sha256 ?? "",
        },
      });
    });
  }

  async deleteLogo(): Promise<OrderedSaveResult> {
    return this.#saveWithToast("Logo", `${this.#basePath}/logo`, { method: "DELETE" }, "delete");
  }

  async saveDecorativeAsset(request: SaveDecorativeAssetRequest): Promise<OrderedSaveResult> {
    return this.#saveWithToast("Decorative Asset", async () => {
      const uploadAssetId = request.upload?.assetId ?? request.name;
      const file = request.upload
        ? await this.#deps.uploadAsset(this.#brandGuideId, uploadAssetId, request.upload.file)
        : null;
      const storedFile = request.storedFile ?? request;
      return this.#save<BrandGuideView>(`${this.#basePath}/decorative-assets`, {
        method: "PUT",
        body: {
          previousName: request.previousName,
          asset: {
            name: request.name,
            filename: file?.filename ?? storedFile.filename,
            mimeType: file?.mimeType ?? storedFile.mimeType,
            description: nullableText(request.description),
            s3Key: file?.s3Key ?? "",
            byteSize: file?.byteSize ?? 0,
            sha256: file?.sha256 ?? "",
          },
        },
      });
    });
  }

  async deleteDecorativeAsset(name: string): Promise<OrderedSaveResult> {
    return this.#saveWithToast(
      "Decorative Asset",
      `${this.#basePath}/decorative-assets/${encodeURIComponent(name)}`,
      { method: "DELETE" },
      "delete",
    );
  }

  debounce(
    save: () => Promise<void>,
    options: Readonly<{ delayMs?: number; errorLabel: string }>,
  ): DebouncedSave {
    let handle: ReturnType<typeof setTimeout> | null = null;
    const delayMs = options.delayMs ?? 650;
    return {
      schedule: () => {
        if (handle) this.#deps.scheduler.clearTimeout(handle);
        handle = this.#deps.scheduler.setTimeout(() => {
          handle = null;
          save().catch(() => undefined);
        }, delayMs);
      },
      cancel: () => {
        if (!handle) return;
        this.#deps.scheduler.clearTimeout(handle);
        handle = null;
      },
    };
  }

  async #saveWithToast(
    label: string,
    pathOrSave: string | (() => Promise<BrandGuideView>),
    options?: Readonly<{ method: SaveMethod; body?: unknown }>,
    action: "save" | "delete" = "save",
  ): Promise<OrderedSaveResult> {
    const save = this.#startSave();
    try {
      const view =
        typeof pathOrSave === "string"
          ? await this.#save<BrandGuideView>(pathOrSave, options ?? { method: "PATCH" })
          : await pathOrSave();
      if (!save.stale() && action === "save") this.#deps.notify.success("Changes saved");
      return { view, stale: save.stale() };
    } catch (error) {
      if (!save.stale())
        this.#deps.notify.error(`Could not ${action} ${label}`, {
          description: errorMessage(error),
        });
      throw error;
    }
  }

  #startSave(): Readonly<{ stale: () => boolean }> {
    const sequence = ++this.#nextSaveSequence;
    this.#latestStartedSaveSequence = sequence;
    return { stale: () => sequence < this.#latestStartedSaveSequence };
  }

  async #save<T>(
    path: string,
    options: Readonly<{ method: SaveMethod; body?: unknown }>,
  ): Promise<T> {
    return this.#deps.sendJson<T>(path, options);
  }
}

export const createBrandGuideEditor = (
  brandGuideId: string,
  deps?: BrandGuideEditorDependencies,
): BrandGuideEditor => new BrandGuideEditor(brandGuideId, deps);

export const optimisticMetadataView = (
  current: BrandGuideView,
  metadata: Readonly<{ name: string; description: string }>,
): BrandGuideView => ({
  ...current,
  brandGuide: {
    ...current.brandGuide,
    name: metadata.name,
    description: nullableText(metadata.description),
  },
});

export const optimisticPresentationKitView = (
  current: BrandGuideView,
  presentationKit: PresentationKitView,
): BrandGuideView => ({ ...current, presentationKit });

const defaultDependencies = (): BrandGuideEditorDependencies => ({
  sendJson,
  uploadAsset: uploadBrandGuideAsset,
  notify: toast,
  publishBrandGuide: publishBrandGuideUpdated,
  scheduler: window,
});

const nullableText = (value: string): string | null => value || null;

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
