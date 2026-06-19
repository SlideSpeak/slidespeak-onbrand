import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { sort_fn } from "color-sorter";
import Color from "colorjs.io";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { WasteIcon } from "@hugeicons/core-free-icons";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { BrandGuideView, ColorToken } from "@onbrand/core/brand-guide/application-service";
import { sendJson } from "../../../shared/api/api-state";

export const ColorTokensSection = ({
  brandGuideId,
  colors,
  onViewChange,
}: Readonly<{
  brandGuideId: string;
  colors: readonly ColorToken[];
  onViewChange: (view: BrandGuideView) => void;
}>) => {
  const sortedColors = sortColorTokensForDisplay(colors);
  const [adding, setAdding] = useState(false);

  return (
    <section id="colors" className="scroll-mt-4 grid gap-3">
      <header className="mb-2 flex items-center justify-between gap-3">
        <h2 className="m-0 text-xl leading-none font-normal tracking-[-0.035em]">Colors</h2>
        <Dialog open={adding} onOpenChange={setAdding}>
          <DialogTrigger asChild>
            <button className="rounded-md bg-onbrand-charcoal px-3 py-2 text-sm text-white" type="button">
              Add Color
            </button>
          </DialogTrigger>
          <ColorTokenDialogContent
            brandGuideId={brandGuideId}
            color={null}
            onViewChange={onViewChange}
            onCreated={onViewChange}
          />
        </Dialog>
      </header>
      {sortedColors.length ? (
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-[repeat(auto-fit,minmax(136px,1fr))]">
          {sortedColors.map((color) => (
            <ColorSwatchCard
              key={color.id}
              brandGuideId={brandGuideId}
              color={color}
              onViewChange={onViewChange}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-onbrand-charcoal/15 p-8 text-center text-sm text-onbrand-charcoal/55">No Color Tokens yet.</p>
      )}
    </section>
  );
};

const ColorSwatchCard = ({
  brandGuideId,
  color,
  onViewChange,
}: Readonly<{ brandGuideId: string; color: ColorToken; onViewChange: (view: BrandGuideView) => void }>) => {
  const colorTextValue = colorText(color.value);
  const uppercaseColorValue = color.value.toUpperCase();
  const pendingView = useRef<BrandGuideView | null>(null);
  const [open, setOpen] = useState(false);

  const changeOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen || !pendingView.current) return;
    onViewChange(pendingView.current);
    pendingView.current = null;
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <button
          className="flex h-52 cursor-pointer flex-col justify-between rounded-md border border-onbrand-charcoal/8 p-3.5 text-left transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-onbrand-blue-200 focus-visible:outline-none"
          style={{ background: color.value, color: colorTextValue }}
          type="button"
        >
          <span className="m-0 text-xl leading-none font-normal tracking-[-0.045em]">
            {color.name}
          </span>
          <span className="m-0 self-end font-mono text-[11px] font-normal tracking-[-0.02em] opacity-75">
            {uppercaseColorValue}
          </span>
        </button>
      </DialogTrigger>
      <ColorTokenDialogContent
        key={`${color.id}:${color.name}:${color.value}:${color.description ?? ""}`}
        brandGuideId={brandGuideId}
        color={color}
        onViewChange={(view) => {
          pendingView.current = view;
        }}
        onDeleted={(view) => {
          pendingView.current = null;
          setOpen(false);
          onViewChange(view);
        }}
      />
    </Dialog>
  );
};

const ColorTokenDialogContent = ({
  brandGuideId,
  color,
  onViewChange,
  onCreated,
  onDeleted,
}: Readonly<{
  brandGuideId: string;
  color: ColorToken | null;
  onViewChange: (view: BrandGuideView) => void;
  onCreated?: (view: BrandGuideView) => void;
  onDeleted?: (view: BrandGuideView) => void;
}>) => {
  const [state, setState] = useReducer(
    (
      current: { name: string; value: string; description: string; pickerOpen: boolean; deleteConfirmOpen: boolean },
      patch: Partial<{ name: string; value: string; description: string; pickerOpen: boolean; deleteConfirmOpen: boolean }>,
    ) => ({ ...current, ...patch }),
    {
      name: color?.name ?? "",
      value: color?.value ?? "#000000",
      description: color?.description ?? "",
      pickerOpen: false,
      deleteConfirmOpen: false,
    },
  );
  const lastSaved = useRef(
    color
      ? { name: color.name, value: color.value.toUpperCase(), description: color.description ?? "" }
      : null,
  );
  const valid = state.name.trim() && /^#[0-9A-Fa-f]{6}$/.test(state.value);
  const normalized = useMemo(
    () => ({ name: state.name.trim(), value: state.value.toUpperCase(), description: state.description.trim() }),
    [state.description, state.name, state.value],
  );

  useEffect(() => {
    if (!valid) return;
    if (
      lastSaved.current &&
      normalized.name === lastSaved.current.name &&
      normalized.value === lastSaved.current.value &&
      normalized.description === lastSaved.current.description
    ) return;
    const timeout = window.setTimeout(() => {
      saveColorToken({
        brandGuideId,
        previousName: lastSaved.current?.name ?? color?.name,
        name: normalized.name,
        value: normalized.value,
        description: normalized.description,
      })
        .then((view) => {
          const wasCreating = !lastSaved.current;
          lastSaved.current = normalized;
          if (wasCreating && onCreated) onCreated(view);
          else onViewChange(view);
          toast.success("Changes saved");
        })
        .catch((error: unknown) => toast.error("Could not save Color Token", { description: errorMessage(error) }));
    }, 650);
    return () => window.clearTimeout(timeout);
  }, [brandGuideId, color?.name, normalized, onCreated, onViewChange, valid]);

  const remove = async () => {
    if (!color) return;
    try {
      const saved = await sendJson<BrandGuideView>(`/api/brand-guides/${encodeURIComponent(brandGuideId)}/colors/${encodeURIComponent(lastSaved.current?.name ?? color.name)}`, { method: "DELETE" });
      setState({ deleteConfirmOpen: false });
      if (onDeleted) onDeleted(saved);
      else onViewChange(saved);
    } catch (error) {
      toast.error("Could not delete Color Token", { description: errorMessage(error) });
    }
  };

  const previewColor = valid ? normalized.value : "#000000";

  return (
    <DialogContent
      className="h-[540px] max-h-[calc(100vh-2rem)] w-[820px] max-w-[calc(100vw-2rem)] overflow-visible border-0 p-0"
      showCloseButton={false}
    >
      <div className="grid h-full md:grid-cols-[minmax(0,1.22fr)_minmax(0,0.78fr)]">
        <Popover open={state.pickerOpen} onOpenChange={(pickerOpen) => setState({ pickerOpen })}>
          <div className="min-h-0 overflow-hidden rounded-l-md" style={{ background: previewColor }}>
            <PopoverTrigger asChild>
              <button
                aria-label="Open color picker"
                className="h-full w-full cursor-pointer"
                type="button"
              />
            </PopoverTrigger>
          </div>
          <PopoverContent
            align="center"
            side="left"
            sideOffset={18}
            portalled={false}
            className="onbrand-color-picker"
          >
            <HexColorPicker color={valid ? normalized.value : "#000000"} onChange={(value) => setState({ value })} />
          </PopoverContent>
        </Popover>
        <div className="flex min-w-0 overflow-hidden flex-col justify-between px-4 py-8 pr-8 md:px-8 md:py-10 md:pr-10">
          <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4">
            <DialogTitle asChild>
              <input
                aria-label="Color name"
                className="m-0 block w-full min-w-0 max-w-full overflow-hidden bg-transparent text-3xl leading-tight font-medium tracking-[-0.055em] text-ellipsis text-onbrand-charcoal outline-none"
                placeholder="Color name"
                spellCheck={false}
                value={state.name}
                onChange={(event) => setState({ name: event.target.value })}
              />
            </DialogTitle>
            <DialogDescription asChild>
              <textarea
                aria-label="Color description"
                className="h-full min-h-0 w-full min-w-0 max-w-full resize-none overflow-y-auto bg-transparent text-sm leading-6 text-onbrand-charcoal/62 outline-none"
                placeholder="Description"
                spellCheck={false}
                value={state.description}
                onChange={(event) => setState({ description: event.target.value })}
              />
            </DialogDescription>
          </div>
          <div className="relative mt-8 flex items-center justify-between gap-3">
            <button
              className="m-0 cursor-pointer bg-transparent font-mono text-sm tracking-[-0.02em] text-onbrand-charcoal/70 uppercase outline-none"
              type="button"
              onClick={() => setState({ pickerOpen: true })}
            >
              {state.value}
            </button>
            <div className="flex items-center gap-3">
              {color ? (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Delete Color Token"
                        className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-onbrand-charcoal transition hover:text-red-600"
                        type="button"
                        onClick={() => setState({ deleteConfirmOpen: true })}
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
      </div>
      <Dialog open={state.deleteConfirmOpen} onOpenChange={(deleteConfirmOpen) => setState({ deleteConfirmOpen })}>
        <DialogContent className="w-[min(420px,calc(100vw-2rem))] p-6" showCloseButton={false}>
          <div className="grid gap-5">
            <div className="grid gap-2 pr-8">
              <DialogTitle className="text-lg font-semibold tracking-[-0.03em] text-onbrand-charcoal">
                Delete {lastSaved.current?.name ?? color?.name}?
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-onbrand-charcoal/60">
                This permanently deletes the color. This action cannot be reverted.
              </DialogDescription>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                className="rounded-md px-4 py-2 text-sm text-onbrand-charcoal/55 transition hover:text-onbrand-charcoal"
                type="button"
                onClick={() => setState({ deleteConfirmOpen: false })}
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
  );
};

const saveColorToken = ({
  brandGuideId,
  previousName,
  name,
  value,
  description,
}: Readonly<{
  brandGuideId: string;
  previousName?: string;
  name: string;
  value: string;
  description: string;
}>): Promise<BrandGuideView> =>
  sendJson<BrandGuideView>(`/api/brand-guides/${encodeURIComponent(brandGuideId)}/colors`, {
    method: "PUT",
    body: {
      previousName,
      name,
      value,
      description: description || null,
    },
  });

const sortColorTokensForDisplay = (colors: readonly ColorToken[]): readonly ColorToken[] =>
  colors
    .slice()
    .sort(
      (firstColor, secondColor) =>
        sort_fn(firstColor.value, secondColor.value) ||
        firstColor.name.localeCompare(secondColor.name),
    );

const LIGHT_SWATCH_TEXT_LIGHTNESS = 0.38;
const DARK_SWATCH_TEXT_LIGHTNESS = 0.72;
const LIGHT_SWATCH_MAXIMUM_TEXT_CHROMA = 0.18;
const DARK_SWATCH_MAXIMUM_TEXT_CHROMA = 0.12;
const LIGHT_SWATCH_MINIMUM_OKLCH_LIGHTNESS = 0.58;

const colorText = (hexColor: string): string => {
  const color = Color.try(hexColor);
  if (!color) return "#111111";

  const oklchColor = color.to("oklch");
  const isLightSwatch = (oklchColor.coords[0] ?? 0) >= LIGHT_SWATCH_MINIMUM_OKLCH_LIGHTNESS;
  const textLightness = isLightSwatch ? LIGHT_SWATCH_TEXT_LIGHTNESS : DARK_SWATCH_TEXT_LIGHTNESS;
  const maximumTextChroma = isLightSwatch
    ? LIGHT_SWATCH_MAXIMUM_TEXT_CHROMA
    : DARK_SWATCH_MAXIMUM_TEXT_CHROMA;

  return oklchColor
    .set("l", textLightness)
    .set("c", (chroma) => Math.min(chroma ?? 0, maximumTextChroma))
    .to("srgb")
    .toGamut()
    .toString({ format: "hex" });
};

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);
