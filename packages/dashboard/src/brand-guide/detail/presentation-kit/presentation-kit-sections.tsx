import { Markdown } from "../../../shared/ui/markdown";
import type { PresentationKitView } from "@onbrand/core/brand-guide/application-service";

export const PresentationKitSection = ({
  presentationKit,
}: Readonly<{ presentationKit: PresentationKitView }>) => (
  <section id="prompt" className="scroll-mt-4 bg-transparent">
    {presentationKit.designPrompt ? (
      <Markdown>{presentationKit.designPrompt}</Markdown>
    ) : (
      <p className="text-onbrand-charcoal/55">No Design Prompt declared.</p>
    )}
  </section>
);
