import { useEffect, useMemo, useState } from "react";
import { Upload01Icon, WasteIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type {
  BrandGuideView,
  BrandKitVisualAsset,
} from "@onbrand/core/brand-guide/application-service";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createBrandGuideEditor } from "../brand-guide-editor";
import { AssetPreview } from "./asset-preview";
import { assetPreviewUrl } from "./asset-preview-url";
import { AssetShowcaseCard } from "./asset-showcase-card";

export const LogoSection = ({
  brandGuideId,
  logo,
  onViewChange,
}: Readonly<{
  brandGuideId: string;
  logo: BrandKitVisualAsset | null;
  onViewChange: (view: BrandGuideView) => void;
}>) => {
  const [editing, setEditing] = useState(false);
  return (
    <section id="logo" className="grid scroll-mt-4 gap-3">
      <header className="mb-2 flex min-h-10 items-center justify-between gap-3">
        <h2 className="m-0 text-xl leading-none font-normal tracking-[-0.035em]">Logo</h2>
      </header>
      {logo ? (
        <div className="columns-2 gap-2.5 md:columns-4 lg:columns-5">
          <AssetShowcaseCard
            asset={logo}
            brandGuideId={brandGuideId}
            onClick={() => setEditing(true)}
            previewEnabled={false}
          />
        </div>
      ) : (
        <button
          className="rounded-md border border-dashed border-onbrand-charcoal/15 p-8 text-center text-sm text-onbrand-charcoal/55"
          type="button"
          onClick={() => setEditing(true)}
        >
          No Logo has been added yet. Click to add one.
        </button>
      )}
      {editing ? (
        <LogoEditor
          brandGuideId={brandGuideId}
          logo={logo}
          onClose={() => setEditing(false)}
          onViewChange={onViewChange}
        />
      ) : null}
    </section>
  );
};

const LogoEditor = ({
  brandGuideId,
  logo,
  onClose,
  onViewChange,
}: Readonly<{
  brandGuideId: string;
  logo: BrandKitVisualAsset | null;
  onClose: () => void;
  onViewChange: (view: BrandGuideView) => void;
}>) => {
  const [description, setDescription] = useState(logo?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const normalizedDescription = useMemo(() => description.trim(), [description]);
  const editor = useMemo(() => createBrandGuideEditor(brandGuideId), [brandGuideId]);
  const descriptionDraftSave = useMemo(
    () =>
      editor.createLogoDescriptionDraftSave(logo, {
        onSaved: (view, draft) => {
          setDescription(draft.description);
          onViewChange(view);
        },
      }),
    [editor, logo, onViewChange],
  );

  useEffect(() => {
    return () => {
      descriptionDraftSave.cancel();
    };
  }, [descriptionDraftSave]);

  const scheduleDescriptionSave = (nextDescription: string) => {
    descriptionDraftSave.update({ description: nextDescription });
  };

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    descriptionDraftSave.cancel();
    editor
      .saveLogo({
        filename: file.name,
        mimeType: file.type,
        description: normalizedDescription,
        upload: { file },
      })
      .then(({ view }) => {
        if (cancelled) return;
        onViewChange(view);
        setFile(null);
        if (!logo) onClose();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [editor, file, logo, normalizedDescription, onClose, onViewChange]);

  const remove = async () => {
    try {
      const { view } = await editor.deleteLogo();
      onViewChange(view);
      setDeleteOpen(false);
      onClose();
    } catch {
      // Toast policy lives in the Brand Guide editor.
    }
  };

  const previewUrl = logo ? assetPreviewUrl({ brandGuideId, assetHandle: logo.assetHandle }) : null;
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
                {file ? file.name : "Drop or choose a logo file"}
              </span>
            )}
            <span className="absolute inset-0 grid place-items-center bg-white/58 p-4 opacity-0 transition duration-200 group-hover:opacity-100">
              <span className="grid h-full w-full place-items-center rounded-md px-8">
                <span className="flex flex-col items-center gap-3 text-center text-sm font-normal tracking-[-0.02em] text-onbrand-charcoal">
                  <HugeiconsIcon className="h-7 w-7" icon={Upload01Icon} strokeWidth={2} />
                  Drop a file or click to update the logo file
                </span>
              </span>
            </span>
            <input
              className="sr-only"
              type="file"
              accept="image/svg+xml,image/png,image/jpeg,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <div className="flex min-w-0 flex-col justify-between overflow-hidden px-4 py-8 pr-8 md:px-8 md:py-10 md:pr-10">
            <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4">
              <DialogTitle className="m-0 block w-full max-w-full min-w-0 bg-transparent text-3xl leading-tight font-medium tracking-[-0.055em] text-onbrand-charcoal outline-none">
                Logo
              </DialogTitle>
              <DialogDescription asChild>
                <textarea
                  aria-label="Logo usage description"
                  className="h-full min-h-0 w-full max-w-full min-w-0 resize-none overflow-y-auto bg-transparent text-sm leading-6 text-onbrand-charcoal/62 outline-none"
                  placeholder="Usage description"
                  spellCheck={false}
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    scheduleDescriptionSave(event.target.value);
                  }}
                />
              </DialogDescription>
            </div>
            <div className="relative mt-8 flex items-center justify-end gap-3">
              {logo ? (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Delete Logo"
                        className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-onbrand-charcoal transition hover:text-red-600"
                        type="button"
                        onClick={() => setDeleteOpen(true)}
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
                  Delete Logo?
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-onbrand-charcoal/60">
                  This permanently deletes the Logo. This action cannot be reverted.
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
