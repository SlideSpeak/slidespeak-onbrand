import { useCallback, useMemo, useState } from "react";

import { useApi } from "../../shared/api/api-state";
import { BrandGuideMetadataSection } from "./brand-guide-metadata-section";
import { BrandKitSections } from "./brand-kit/brand-kit-sections";
import type { AssetLayout } from "./brand-kit/brand-kit-assets-sections";
import {
  createBrandGuideEditor,
  optimisticMetadataView,
  optimisticPresentationKitView,
} from "./brand-guide-editor";
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
  return (
    <BrandGuideDetailView
      key={state.data.brandGuide.id}
      initialView={state.data}
      section={section}
    />
  );
};

const BrandGuideDetailView = ({
  initialView,
  section,
}: Readonly<{ initialView: BrandGuideView; section: BrandGuideSection }>) => {
  const [view, setView] = useState(initialView);
  const [assetLayout, setAssetLayout] = useState<AssetLayout>("MASONRY");
  const editor = useMemo(
    () => createBrandGuideEditor(initialView.brandGuide.id),
    [initialView.brandGuide.id],
  );

  const saveMetadata = useCallback(
    async (metadata: { name: string; description: string }) => {
      setView((current) => optimisticMetadataView(current, metadata));
      const { view: saved } = await editor.saveMetadata(metadata);
      setView(saved);
    },
    [editor],
  );

  const savePresentationKit = async (presentationKit: BrandGuideView["presentationKit"]) => {
    setView((current) => optimisticPresentationKitView(current, presentationKit));
    const { view: saved } = await editor.savePresentationKit(presentationKit);
    setView(saved);
  };

  return (
    <section
      className={`grid gap-3 ${section === "PRESENTATION" ? "h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]" : "content-start"}`}
    >
      {section === "COLORS" ||
      section === "ASSETS" ||
      section === "LOGO" ||
      section === "PRESENTATION" ? null : (
        <PageHeader title={brandGuideSectionLabel(section)} />
      )}
      <BrandGuideSectionPage
        assetLayout={assetLayout}
        view={view}
        section={section}
        onAssetLayoutChange={setAssetLayout}
        onViewChange={setView}
        onMetadataChange={saveMetadata}
        onPresentationKitChange={savePresentationKit}
      />
    </section>
  );
};

const BrandGuideSectionPage = ({
  assetLayout,
  view,
  section,
  onViewChange,
  onAssetLayoutChange,
  onMetadataChange,
  onPresentationKitChange,
}: Readonly<{
  assetLayout: AssetLayout;
  view: BrandGuideView;
  section: BrandGuideSection;
  onViewChange: (view: BrandGuideView) => void;
  onAssetLayoutChange: (assetLayout: AssetLayout) => void;
  onMetadataChange: (metadata: { name: string; description: string }) => Promise<void>;
  onPresentationKitChange: (presentationKit: BrandGuideView["presentationKit"]) => Promise<void>;
}>) => {
  switch (section) {
    case "METADATA":
      return (
        <BrandGuideMetadataSection
          brandGuide={view.brandGuide}
          onMetadataChange={onMetadataChange}
        />
      );
    case "COLORS":
      return (
        <BrandKitSections
          brandKit={view.brandKit}
          brandGuideId={view.brandGuide.id}
          section="COLORS"
          onViewChange={onViewChange}
        />
      );
    case "LOGO":
      return (
        <BrandKitSections
          brandKit={view.brandKit}
          brandGuideId={view.brandGuide.id}
          section="LOGO"
          onViewChange={onViewChange}
        />
      );
    case "ASSETS":
      return (
        <BrandKitSections
          assetLayout={assetLayout}
          onAssetLayoutChange={onAssetLayoutChange}
          brandKit={view.brandKit}
          brandGuideId={view.brandGuide.id}
          section="ASSETS"
          onViewChange={onViewChange}
        />
      );
    case "PRESENTATION":
      return (
        <PresentationKitSection
          presentationKit={view.presentationKit}
          onPresentationKitChange={onPresentationKitChange}
        />
      );
  }
};
