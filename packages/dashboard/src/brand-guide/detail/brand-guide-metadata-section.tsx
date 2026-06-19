import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { WasteIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { BrandGuideView } from "@onbrand/core/brand-guide/application-service";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { sendJson } from "../../shared/api/api-state";
import { publishBrandGuideDeleted } from "../../shared/brand-guide-sync";

type MetadataState = Readonly<{
  name: string;
  description: string;
}>;

export const BrandGuideMetadataSection = ({
  brandGuide,
  onMetadataChange,
}: Readonly<{
  brandGuide: BrandGuideView["brandGuide"];
  onMetadataChange: (metadata: MetadataState) => Promise<void>;
}>) => {
  const [state, setState] = useReducer(
    (current: MetadataState, patch: Partial<MetadataState>) => ({ ...current, ...patch }),
    {
      name: brandGuide.name,
      description: brandGuide.description ?? "",
    },
  );
  const lastSaved = useRef<MetadataState>({
    name: brandGuide.name,
    description: brandGuide.description ?? "",
  });
  const saveMetadata = useRef(onMetadataChange);
  const pendingSaveKey = useRef<string | null>(null);

  useEffect(() => {
    saveMetadata.current = onMetadataChange;
  }, [onMetadataChange]);

  const normalized = useMemo(
    () => ({ name: state.name.trim(), description: state.description.trim() }),
    [state.description, state.name],
  );

  useEffect(() => {
    if (!normalized.name) return;
    if (
      normalized.name === lastSaved.current.name &&
      normalized.description === lastSaved.current.description
    )
      return;

    const saveKey = `${normalized.name}\n${normalized.description}`;
    if (pendingSaveKey.current === saveKey) return;

    const timeout = window.setTimeout(() => {
      pendingSaveKey.current = saveKey;
      saveMetadata
        .current(normalized)
        .then(() => {
          lastSaved.current = normalized;
          toast.success("Changes saved");
        })
        .catch((error: unknown) =>
          toast.error("Could not save Brand Guide info", {
            description: error instanceof Error ? error.message : String(error),
          }),
        )
        .finally(() => {
          if (pendingSaveKey.current === saveKey) pendingSaveKey.current = null;
        });
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [normalized]);

  return (
    <section
      id="details"
      className="flex min-h-[calc(100vh-12rem)] w-full scroll-mt-4 flex-col gap-8"
    >
      <label className="grid gap-3">
        <span className="text-sm text-onbrand-charcoal/45">Name</span>
        <input
          aria-label="Brand Guide name"
          className="w-full bg-transparent text-4xl leading-tight font-medium tracking-[-0.055em] text-onbrand-charcoal outline-none"
          placeholder="Brand Guide name"
          spellCheck={false}
          value={state.name}
          onChange={(event) => setState({ name: event.target.value })}
        />
      </label>
      <label className="grid gap-3">
        <span className="text-sm text-onbrand-charcoal/45">Description</span>
        <textarea
          aria-label="Brand Guide description"
          className="min-h-56 w-full resize-none bg-transparent text-sm leading-6 text-onbrand-charcoal/70 outline-none"
          placeholder="Optional description"
          spellCheck={false}
          value={state.description}
          onChange={(event) => setState({ description: event.target.value })}
        />
      </label>
      <BrandGuideDangerZone brandGuide={brandGuide} />
    </section>
  );
};

const BrandGuideDangerZone = ({
  brandGuide,
}: Readonly<{ brandGuide: BrandGuideView["brandGuide"] }>) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  const remove = async () => {
    if (typed !== brandGuide.name) return;
    try {
      await sendJson<void>(`/api/brand-guides/${encodeURIComponent(brandGuide.id)}`, {
        method: "DELETE",
      });
      publishBrandGuideDeleted(brandGuide.id);
      setOpen(false);
      await navigate({ to: "/home" });
    } catch (error) {
      toast.error("Could not delete Brand Guide", {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <section className="mt-auto grid gap-4 pt-8">
      <div>
        <h3 className="text-sm font-medium text-red-600">Danger Zone</h3>
      </div>
      <button
        className="flex w-fit cursor-pointer items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        type="button"
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon className="h-4 w-4" icon={WasteIcon} strokeWidth={2} />
        Delete Brand Guide
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[min(480px,calc(100vw-2rem))] p-6" showCloseButton={false}>
          <div className="grid gap-4">
            <DialogTitle>Delete {brandGuide.name}?</DialogTitle>
            <DialogDescription>
              This permanently deletes the Brand Guide, contained kits, database records, and S3
              asset objects. This action cannot be reverted.
            </DialogDescription>
            <label className="grid gap-2 text-sm">
              Type <strong>{brandGuide.name}</strong> to confirm
              <input
                aria-label="Confirm Brand Guide name"
                className="rounded-md border border-onbrand-charcoal/15 p-2 outline-none"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                className="rounded-md px-4 py-2 text-sm text-onbrand-charcoal/65"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={typed !== brandGuide.name}
                type="button"
                onClick={() => void remove()}
              >
                Delete permanently
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
