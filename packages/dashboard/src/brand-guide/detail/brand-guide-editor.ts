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

export type SaveResult = Readonly<{ view: BrandGuideView }>;

export type DebouncedSave = Readonly<{
  schedule: () => void;
  cancel: () => void;
}>;

export class BrandGuideEditor {
  readonly #deps: BrandGuideEditorDependencies;
  readonly #brandGuideId: string;
  readonly #basePath: string;

  constructor(brandGuideId: string, deps: BrandGuideEditorDependencies = defaultDependencies()) {
    this.#brandGuideId = brandGuideId;
    this.#deps = deps;
    this.#basePath = `/api/brand-guides/${encodeURIComponent(brandGuideId)}`;
  }

  async saveMetadata(
    metadata: Readonly<{ name: string; description: string }>,
  ): Promise<SaveResult> {
    const view = await this.#save<BrandGuideView>(`${this.#basePath}/metadata`, {
      method: "PATCH",
      body: { name: metadata.name, description: nullableText(metadata.description) },
    });
    this.#deps.publishBrandGuide(view.brandGuide);
    return { view };
  }

  async savePresentationKit(presentationKit: PresentationKitView): Promise<SaveResult> {
    const view = await this.#saveWithToast(
      "Presentation Kit",
      `${this.#basePath}/presentation-kit`,
      {
        method: "PATCH",
        body: presentationKit,
      },
    );
    this.#deps.publishBrandGuide(view.brandGuide);
    return { view };
  }

  async saveColorToken(request: SaveColorTokenRequest): Promise<SaveResult> {
    const view = await this.#saveWithToast("Color Token", `${this.#basePath}/colors`, {
      method: "PUT",
      body: {
        previousName: request.previousName,
        name: request.name,
        value: request.value,
        description: nullableText(request.description),
      },
    });
    return { view };
  }

  async deleteColorToken(name: string): Promise<SaveResult> {
    const view = await this.#saveWithToast(
      "Color Token",
      `${this.#basePath}/colors/${encodeURIComponent(name)}`,
      { method: "DELETE" },
      "delete",
    );
    return { view };
  }

  async saveLogo(request: SaveLogoRequest): Promise<SaveResult> {
    const file = request.upload
      ? await this.#deps.uploadAsset(this.#brandGuideId, "logo", request.upload.file)
      : null;
    const storedFile = request.storedFile ?? request;
    const view = await this.#saveWithToast("Logo", `${this.#basePath}/logo`, {
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
    return { view };
  }

  async deleteLogo(): Promise<SaveResult> {
    const view = await this.#saveWithToast(
      "Logo",
      `${this.#basePath}/logo`,
      { method: "DELETE" },
      "delete",
    );
    return { view };
  }

  async saveDecorativeAsset(request: SaveDecorativeAssetRequest): Promise<SaveResult> {
    const uploadAssetId = request.upload?.assetId ?? request.name;
    const file = request.upload
      ? await this.#deps.uploadAsset(this.#brandGuideId, uploadAssetId, request.upload.file)
      : null;
    const storedFile = request.storedFile ?? request;
    const view = await this.#saveWithToast(
      "Decorative Asset",
      `${this.#basePath}/decorative-assets`,
      {
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
      },
    );
    return { view };
  }

  async deleteDecorativeAsset(name: string): Promise<SaveResult> {
    const view = await this.#saveWithToast(
      "Decorative Asset",
      `${this.#basePath}/decorative-assets/${encodeURIComponent(name)}`,
      { method: "DELETE" },
      "delete",
    );
    return { view };
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
    path: string,
    options: Readonly<{ method: SaveMethod; body?: unknown }>,
    action: "save" | "delete" = "save",
  ): Promise<BrandGuideView> {
    try {
      const view = await this.#save<BrandGuideView>(path, options);
      if (action === "save") this.#deps.notify.success("Changes saved");
      return view;
    } catch (error) {
      this.#deps.notify.error(`Could not ${action} ${label}`, { description: errorMessage(error) });
      throw error;
    }
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
