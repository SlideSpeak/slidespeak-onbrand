import { sort_fn } from "color-sorter";
import Color from "colorjs.io";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ColorToken } from "@onbrand/core/brand-guide/application-service";

export const ColorTokensSection = ({ colors }: Readonly<{ colors: readonly ColorToken[] }>) => {
  const sortedColors = sortColorTokensForDisplay(colors);

  return (
    <section id="colors" className="scroll-mt-4">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-[repeat(auto-fit,minmax(136px,1fr))]">
        {sortedColors.map((color) => (
          <ColorSwatchCard key={color.id} color={color} />
        ))}
      </div>
    </section>
  );
};

const ColorSwatchCard = ({ color }: Readonly<{ color: ColorToken }>) => {
  const colorTextValue = colorText(color.value);
  const uppercaseColorValue = color.value.toUpperCase();

  return (
    <Dialog>
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
      <DialogContent
        className="h-[540px] max-h-[calc(100vh-2rem)] w-[820px] max-w-[calc(100vw-2rem)] border-0 p-0"
        showCloseButton={false}
      >
        <div className="grid h-full md:grid-cols-[minmax(0,1.22fr)_minmax(0,0.78fr)]">
          <div className="min-h-0 overflow-hidden" style={{ background: color.value }} />
          <div className="flex min-w-0 flex-col justify-between px-4 py-8 pr-8 md:px-8 md:py-10 md:pr-10">
            <div>
              <DialogTitle className="m-0 max-w-sm text-3xl leading-none font-medium tracking-[-0.055em] text-onbrand-charcoal">
                {color.name}
              </DialogTitle>
              <DialogDescription className="mt-4 max-w-sm text-sm leading-6 text-onbrand-charcoal/62">
                {color.description}
              </DialogDescription>
            </div>
            <p className="m-0 mt-8 self-start font-mono text-sm tracking-[-0.02em] text-onbrand-charcoal/70">
              {uppercaseColorValue}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
