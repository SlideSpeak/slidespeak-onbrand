import { useState } from "react";

import { useApi } from "../../shared/api/api-state";
import { BrandKitSections } from "./brand-kit/brand-kit-sections";
import { AssetLayoutSwitch, type AssetLayout } from "./brand-kit/brand-kit-assets-sections";
import { PresentationKitSection } from "./presentation-kit/presentation-kit-sections";
import { ErrorMessage } from "../../shared/ui/feedback";
import { PageHeader } from "../../shared/ui/page-header";
import type { BrandGuideView } from "@onbrand/core/brand-guide/application-service";
import {
  DEFAULT_BRAND_GUIDE_SECTION,
  brandGuideSectionLabel,
  type BrandGuideSection,
} from "../navigation/brand-guide-sections";

export const BrandGuideDetail = ({
  id,
  section = DEFAULT_BRAND_GUIDE_SECTION,
}: Readonly<{ id: string; section?: BrandGuideSection }>) => {
  const state = useApi<BrandGuideView>(`/api/brand-guides/${encodeURIComponent(id)}`);
  if (state.status === "LOADING")
    return <p className="text-onbrand-charcoal/55">Loading Brand Guide…</p>;
  if (state.status === "ERROR") return <ErrorMessage message={state.message} />;
  return <BrandGuideDetailView view={state.data} section={section} />;
};

const PRESENTATION_SECTION_DESCRIPTION =
  "Plain language instructions to guide AI agents on how to use this brand guide";

const BrandGuideDetailView = ({
  view,
  section,
}: Readonly<{ view: BrandGuideView; section: BrandGuideSection }>) => {
  const [assetLayout, setAssetLayout] = useState<AssetLayout>("MASONRY");

  return (
    <section className="grid gap-3">
      <PageHeader
        action={
          section === "ASSETS" ? (
            <AssetLayoutSwitch assetLayout={assetLayout} onAssetLayoutChange={setAssetLayout} />
          ) : undefined
        }
        description={section === "PRESENTATION" ? PRESENTATION_SECTION_DESCRIPTION : undefined}
        title={brandGuideSectionLabel(section)}
      />
      <BrandGuideSectionPage assetLayout={assetLayout} view={view} section={section} />
    </section>
  );
};

const BrandGuideSectionPage = ({
  assetLayout,
  view,
  section,
}: Readonly<{
  assetLayout: AssetLayout;
  view: BrandGuideView;
  section: BrandGuideSection;
}>) => {
  switch (section) {
    case "COLORS":
      return (
        <BrandKitSections
          brandKit={view.brandKit}
          brandGuideId={view.brandGuide.id}
          section="COLORS"
        />
      );
    case "LOGO":
      return (
        <BrandKitSections
          brandKit={view.brandKit}
          brandGuideId={view.brandGuide.id}
          section="LOGO"
        />
      );
    case "ASSETS":
      return (
        <BrandKitSections
          assetLayout={assetLayout}
          brandKit={view.brandKit}
          brandGuideId={view.brandGuide.id}
          section="ASSETS"
        />
      );
    case "PRESENTATION":
      return <PresentationKitSection presentationKit={view.presentationKit} />;
  }
};
