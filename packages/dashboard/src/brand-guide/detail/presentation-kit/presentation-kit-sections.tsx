import { useEffect, useMemo, useState } from "react";
import type {
  BrandGuideView,
  PresentationKitView,
} from "@onbrand/core/brand-guide/application-service";

import { createBrandGuideEditor } from "../brand-guide-editor";
import { MarkdownDesignPromptEditor } from "./markdown-design-prompt-editor";

export const PresentationKitSection = ({
  brandGuideId,
  presentationKit,
  onViewChange,
}: Readonly<{
  brandGuideId: string;
  presentationKit: PresentationKitView;
  onViewChange: (view: BrandGuideView) => void;
}>) => {
  const [width, setWidth] = useState(presentationKit.canvas?.width.toString() ?? "");
  const [height, setHeight] = useState(presentationKit.canvas?.height.toString() ?? "");
  const [designPrompt, setDesignPrompt] = useState(presentationKit.designPrompt ?? "");

  const nextPresentationKit = useMemo<PresentationKitView | null>(() => {
    if ((width.trim() && !height.trim()) || (!width.trim() && height.trim())) return null;
    if (Number(width) < 0 || Number(height) < 0) return null;
    const canvas =
      width.trim() && height.trim()
        ? { width: Number(width), height: Number(height), unit: "px" as const }
        : null;
    return { canvas, designPrompt: designPrompt.trim() || null };
  }, [designPrompt, height, width]);
  const editor = useMemo(() => createBrandGuideEditor(brandGuideId), [brandGuideId]);
  const draftSave = useMemo(
    () =>
      editor.createPresentationKitDraftSave(presentationKit, {
        onSaved: onViewChange,
      }),
    [editor, onViewChange, presentationKit],
  );

  useEffect(() => {
    if (!nextPresentationKit) return;
    draftSave.update(nextPresentationKit);
    return draftSave.cancel;
  }, [draftSave, nextPresentationKit]);

  return (
    <section
      id="prompt"
      className="grid h-full min-h-0 scroll-mt-4 grid-rows-[auto_auto_minmax(0,1fr)] gap-8 bg-transparent"
    >
      <header className="mb-2 flex min-h-10 items-center justify-between gap-3">
        <h2 className="m-0 text-xl leading-none font-normal tracking-[-0.035em]">
          Presentation Kit
        </h2>
      </header>
      <div className="grid gap-3">
        <p className="m-0 text-sm leading-6 text-onbrand-charcoal/62">
          Dimensions, in pixels, for the presentations
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid w-28 gap-1">
            <span className="text-xs text-onbrand-charcoal/45">Width</span>
            <input
              aria-label="Slide Canvas width"
              className="bg-transparent text-2xl leading-tight font-medium tracking-[-0.045em] text-onbrand-charcoal outline-none"
              inputMode="numeric"
              placeholder="1280"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
          </label>
          <label className="grid w-28 gap-1">
            <span className="text-xs text-onbrand-charcoal/45">Height</span>
            <input
              aria-label="Slide Canvas height"
              className="bg-transparent text-2xl leading-tight font-medium tracking-[-0.045em] text-onbrand-charcoal outline-none"
              inputMode="numeric"
              placeholder="720"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
        <span className="text-sm leading-6 text-onbrand-charcoal/62">
          Plain language instructions to guide AI agents on how to use this brand guide
        </span>
        <MarkdownDesignPromptEditor markdown={designPrompt} onMarkdownChange={setDesignPrompt} />
      </div>
    </section>
  );
};
