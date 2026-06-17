import { useState } from "react";

import { useApi } from "../../shared/api/api-state";
import { BrandKitSections } from "./brand-kit/brand-kit-sections";
import { AssetLayoutSwitch, type AssetLayout } from "./brand-kit/brand-kit-assets-sections";
import { PresentationKitSection } from "./presentation-kit/presentation-kit-sections";
import { ErrorMessage } from "../../shared/ui/feedback";
import { PageHeader } from "../../shared/ui/page-header";
import type { DesignSystemView } from "@onbrand/core/design-system/application-service";
import {
  DEFAULT_DESIGN_SYSTEM_SECTION,
  designSystemSectionLabel,
  type DesignSystemSection,
} from "../navigation/design-system-sections";

export const DesignSystemDetail = ({
  id,
  section = DEFAULT_DESIGN_SYSTEM_SECTION,
}: Readonly<{ id: string; section?: DesignSystemSection }>) => {
  const state = useApi<DesignSystemView>(`/api/design-systems/${encodeURIComponent(id)}`);
  if (state.status === "LOADING")
    return <p className="text-onbrand-charcoal/55">Loading Design System…</p>;
  if (state.status === "ERROR") return <ErrorMessage message={state.message} />;
  return <DesignSystemDetailView view={state.data} section={section} />;
};

const PRESENTATION_SECTION_DESCRIPTION =
  "Plain language instructions to guide AI agents on how to use this design system";

const DesignSystemDetailView = ({
  view,
  section,
}: Readonly<{ view: DesignSystemView; section: DesignSystemSection }>) => {
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
        title={designSystemSectionLabel(section)}
      />
      <DesignSystemSectionPage assetLayout={assetLayout} view={view} section={section} />
    </section>
  );
};

const DesignSystemSectionPage = ({
  assetLayout,
  view,
  section,
}: Readonly<{
  assetLayout: AssetLayout;
  view: DesignSystemView;
  section: DesignSystemSection;
}>) => {
  switch (section) {
    case "COLORS":
      return (
        <BrandKitSections
          brandKit={view.brandKit}
          designSystemId={view.designSystem.id}
          section="COLORS"
        />
      );
    case "LOGO":
      return (
        <BrandKitSections
          brandKit={view.brandKit}
          designSystemId={view.designSystem.id}
          section="LOGO"
        />
      );
    case "ASSETS":
      return (
        <BrandKitSections
          assetLayout={assetLayout}
          brandKit={view.brandKit}
          designSystemId={view.designSystem.id}
          section="ASSETS"
        />
      );
    case "PRESENTATION":
      return <PresentationKitSection presentationKit={view.presentationKit} />;
  }
};
