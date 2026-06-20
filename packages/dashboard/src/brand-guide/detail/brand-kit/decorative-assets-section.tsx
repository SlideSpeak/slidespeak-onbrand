import { useEffect, useMemo, useRef, useState } from "react";
import { Upload01Icon, WasteIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type {
  BrandGuideView,
  BrandKitDecorativeAsset,
} from "@onbrand/core/brand-guide/application-service";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createBrandGuideEditor } from "../brand-guide-editor";
import type { AssetLayout } from "./asset-layout";
import { AssetLayoutSwitch } from "./asset-layout-switch";
import { AssetPreview } from "./asset-preview";
import { assetPreviewUrl } from "./asset-preview-url";
import { AssetShowcaseCard } from "./asset-showcase-card";
import { AssetShowcaseListItem } from "./asset-showcase-list-item";

export const DecorativeAssetsSection = ({
  assetLayout,
  onAssetLayoutChange,
  decorativeAssets,
  brandGuideId,
  onViewChange,
}: Readonly<{
  assetLayout: AssetLayout;
  onAssetLayoutChange?: (assetLayout: AssetLayout) => void;
  decorativeAssets: readonly BrandKitDecorativeAsset[];
  brandGuideId: string;
  onViewChange: (view: BrandGuideView) => void;
}>) => {
  const [editing, setEditing] = useState<BrandKitDecorativeAsset | null>(null);
  return (
    <section id="assets" className="grid scroll-mt-4 gap-3">
      <header className="mb-2 flex items-center justify-between gap-3">
        <h2 className="m-0 text-xl leading-none font-normal tracking-[-0.035em]">
          Decorative Assets
        </h2>
        <div className="flex items-center gap-3">
          {onAssetLayoutChange ? (
            <AssetLayoutSwitch
              assetLayout={assetLayout}
              onAssetLayoutChange={onAssetLayoutChange}
            />
          ) : null}
          <button
            className="rounded-md bg-onbrand-charcoal px-3 py-2 text-sm text-white"
            type="button"
            onClick={() =>
              setEditing({
                id: "",
                name: "",
                assetHandle: "",
                filename: "",
                mimeType: "image/png",
                description: "",
              })
            }
          >
            Add Asset
          </button>
        </div>
      </header>
      {decorativeAssets.length === 0 ? (
        <p className="rounded-md border border-dashed border-onbrand-charcoal/15 p-8 text-center text-sm text-onbrand-charcoal/55">
          No Decorative Assets declared.
        </p>
      ) : assetLayout === "MASONRY" ? (
        <div className="columns-2 gap-2.5 md:columns-4 lg:columns-5">
          {decorativeAssets.map((asset) => (
            <AssetShowcaseCard
              key={asset.id}
              asset={asset}
              brandGuideId={brandGuideId}
              onClick={() => setEditing(asset)}
              previewEnabled={false}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-1.5 md:grid-cols-2">
          {decorativeAssets.map((asset) => (
            <AssetShowcaseListItem
              key={asset.id}
              asset={asset}
              brandGuideId={brandGuideId}
              onClick={() => setEditing(asset)}
              previewEnabled={false}
            />
          ))}
        </div>
      )}
      {editing ? (
        <DecorativeAssetEditor
          key={editing.id || "new"}
          brandGuideId={brandGuideId}
          asset={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onViewChange={onViewChange}
        />
      ) : null}
    </section>
  );
};

const DecorativeAssetEditor = ({
  brandGuideId,
  asset,
  onClose,
  onViewChange,
}: Readonly<{
  brandGuideId: string;
  asset: BrandKitDecorativeAsset | null;
  onClose: () => void;
  onViewChange: (view: BrandGuideView) => void;
}>) => {
  const [name, setName] = useState(asset?.name ?? "");
  const [description, setDescription] = useState(asset?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const previousName = useRef(asset?.name);
  const normalized = useMemo(
    () => ({ name: name.trim(), description: description.trim() }),
    [description, name],
  );
  const editor = useMemo(() => createBrandGuideEditor(brandGuideId), [brandGuideId]);
  const metadataDraftSave = useMemo(
    () =>
      editor.createDecorativeAssetMetadataDraftSave(asset, {
        onSaved: (view, draft) => {
          previousName.current = draft.name;
          setName(draft.name);
          setDescription(draft.description);
          onViewChange(view);
        },
      }),
    [asset, editor, onViewChange],
  );

  useEffect(() => {
    return () => {
      metadataDraftSave.cancel();
    };
  }, [metadataDraftSave]);

  const scheduleMetadataSave = (nextName: string, nextDescription: string) => {
    metadataDraftSave.update({ name: nextName, description: nextDescription });
  };

  useEffect(() => {
    if (!file || !normalized.name) return;
    let cancelled = false;
    metadataDraftSave.cancel();
    editor
      .saveDecorativeAsset({
        previousName: previousName.current,
        name: normalized.name,
        filename: file.name,
        mimeType: file.type,
        description: normalized.description,
        upload: { file },
      })
      .then(({ view }) => {
        if (cancelled) return;
        previousName.current = normalized.name;
        onViewChange(view);
        setFile(null);
        if (!asset) onClose();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [asset, editor, file, normalized, onClose, onViewChange]);
  const remove = async () => {
    if (!asset) return;
    try {
      const { view } = await editor.deleteDecorativeAsset(asset.name);
      onViewChange(view);
      setDeleteOpen(false);
      onClose();
    } catch {
      // Toast policy lives in the Brand Guide editor.
    }
  };
  const previewUrl = asset
    ? assetPreviewUrl({ brandGuideId, assetHandle: asset.assetHandle })
    : null;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="h-[540px] max-h-[calc(100vh-2rem)] w-[820px] max-w-[calc(100vw-2rem)] border-0 p-0"
        showCloseButton={false}
      >
        <div className="grid h-full md:grid-cols-[minmax(0,1.22fr)_minmax(0,0.78fr)]">
          <label
            className="group relative grid min-h-0 cursor-pointer place-items-center overflow-hidden bg-onbrand-charcoal/5"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              setFile(event.dataTransfer.files[0] ?? null);
            }}
          >
            {previewUrl && !file ? (
              <AssetPreview
                alt={description}
                className="h-full w-full object-cover"
                src={previewUrl}
              />
            ) : (
              <span className="px-6 text-center text-sm text-onbrand-charcoal/45">
                {file ? file.name : "Drop or choose a file"}
              </span>
            )}
            <span className="absolute inset-0 grid place-items-center bg-white/58 p-4 opacity-0 transition duration-200 group-hover:opacity-100">
              <span className="grid h-full w-full place-items-center rounded-md px-8">
                <span className="flex flex-col items-center gap-3 text-center text-sm font-normal tracking-[-0.02em] text-onbrand-charcoal">
                  <HugeiconsIcon className="h-7 w-7" icon={Upload01Icon} strokeWidth={2} />
                  Drop a file or click to update the asset file
                </span>
              </span>
            </span>
            <input
              className="sr-only"
              type="file"
              accept="image/svg+xml,image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="flex min-w-0 flex-col justify-between overflow-hidden px-4 py-8 pr-8 md:px-8 md:py-10 md:pr-10">
            <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4">
              <DialogTitle asChild>
                <input
                  aria-label="Decorative Asset name"
                  className="m-0 block w-full max-w-full min-w-0 bg-transparent text-3xl leading-tight font-medium tracking-[-0.055em] text-onbrand-charcoal outline-none"
                  placeholder="Asset name"
                  spellCheck={false}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    scheduleMetadataSave(event.target.value, description);
                  }}
                />
              </DialogTitle>
              <DialogDescription asChild>
                <textarea
                  aria-label="Decorative Asset description"
                  className="h-full min-h-0 w-full max-w-full min-w-0 resize-none overflow-y-auto bg-transparent text-sm leading-6 text-onbrand-charcoal/62 outline-none"
                  placeholder="Description"
                  spellCheck={false}
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    scheduleMetadataSave(name, event.target.value);
                  }}
                />
              </DialogDescription>
            </div>
            <div className="relative mt-8 flex items-center justify-end gap-3">
              {asset ? (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Delete Decorative Asset"
                        className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-onbrand-charcoal transition hover:text-red-600"
                        onClick={() => setDeleteOpen(true)}
                        type="button"
                      >
                        <HugeiconsIcon className="h-4 w-4" icon={WasteIcon} strokeWidth={2} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Delete</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
          </div>
        </div>
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="w-[min(420px,calc(100vw-2rem))] p-6" showCloseButton={false}>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <DialogTitle className="text-lg font-semibold tracking-[-0.03em] text-onbrand-charcoal">
                  Delete {asset?.name}?
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-onbrand-charcoal/60">
                  This permanently deletes the Decorative Asset. This action cannot be reverted.
                </DialogDescription>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  className="rounded-md px-4 py-2 text-sm text-onbrand-charcoal/55 transition hover:text-onbrand-charcoal"
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                  type="button"
                  onClick={() => void remove()}
                >
                  Delete
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
