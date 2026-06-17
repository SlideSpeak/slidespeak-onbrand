import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { useApi } from "../shared/api/api-state";
import { DesignSystemDetail } from "../design-system/detail/design-system-detail";
import type { DesignSystemSummary } from "@onbrand/core/design-system/application-service";
import {
  DEFAULT_DESIGN_SYSTEM_SECTION,
  DESIGN_SYSTEM_SECTION_LINKS,
  designSystemSectionLabel,
  designSystemSectionPathSegment,
  type DesignSystemSection,
} from "../design-system/navigation/design-system-sections";
import type { ApiState } from "../shared/api/api-state";
import { EmptyState, ErrorMessage } from "../shared/ui/feedback";
import onbrandLogoUrl from "../assets/onbrand-logo.svg";
import { routeFromPathname } from "./route";

const NO_DESIGN_SYSTEM = "NO_DESIGN_SYSTEM";

export const DashboardApp = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const route = routeFromPathname(pathname);
  const designSystems = useApi<readonly DesignSystemSummary[]>("/api/design-systems");
  const selectedDesignSystemId =
    route.selectedDesignSystemId ??
    (designSystems.status === "READY" ? designSystems.data[0]?.id : undefined);
  const selectedDesignSystem =
    designSystems.status === "READY"
      ? designSystems.data.find((designSystem) => designSystem.id === selectedDesignSystemId)
      : undefined;

  return (
    <div className="min-h-screen bg-onbrand-white text-onbrand-charcoal">
      <div className="flex min-h-screen overflow-hidden border border-onbrand-charcoal/10 bg-onbrand-white shadow-[0_32px_120px_rgba(10,10,10,0.16)]">
        <DashboardRail
          selectedDesignSystemId={selectedDesignSystemId}
          selectedDesignSystemSection={route.selectedDesignSystemSection}
        />
        <div className="min-w-0 flex-1 border-l border-onbrand-charcoal/8 bg-onbrand-white">
          <DashboardTopBar
            designSystems={designSystems}
            selectedDesignSystemId={selectedDesignSystemId}
            selectedDesignSystemName={selectedDesignSystem?.name}
            selectedDesignSystemSection={route.selectedDesignSystemSection}
          />
          <main className="min-w-0 overflow-y-auto px-4 py-4 sm:px-6 lg:max-h-[calc(100vh-4rem)] lg:px-7 lg:py-5">
            {selectedDesignSystemId ? (
              <DesignSystemDetail
                id={selectedDesignSystemId}
                section={route.selectedDesignSystemSection}
              />
            ) : designSystems.status === "ERROR" ? (
              <ErrorMessage message={designSystems.message} />
            ) : designSystems.status === "READY" ? (
              <EmptyState />
            ) : (
              <p className="text-onbrand-charcoal/45">Loading your Design Systems…</p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

const DashboardTopBar = ({
  designSystems,
  selectedDesignSystemId,
  selectedDesignSystemName,
  selectedDesignSystemSection = DEFAULT_DESIGN_SYSTEM_SECTION,
}: Readonly<{
  designSystems: ApiState<readonly DesignSystemSummary[]>;
  selectedDesignSystemId?: string;
  selectedDesignSystemName?: string;
  selectedDesignSystemSection?: DesignSystemSection;
}>) => {
  const navigate = useNavigate();

  return (
    <header className="flex h-16 items-center gap-4 border-b border-onbrand-charcoal/8 px-4 sm:px-6 lg:px-7">
      <div className="flex min-w-0 flex-1 items-center gap-3 text-sm">
        <span className="truncate font-normal text-onbrand-charcoal">
          {selectedDesignSystemName ?? "Select Design System"}
        </span>
        <span className="text-onbrand-charcoal/25">/</span>
        <span className="truncate text-onbrand-charcoal/55">
          {designSystemSectionLabel(selectedDesignSystemSection)}
        </span>
      </div>
      {designSystems.status === "READY" ? (
        <Select
          value={selectedDesignSystemId ?? NO_DESIGN_SYSTEM}
          onValueChange={(value) => {
            if (value !== NO_DESIGN_SYSTEM)
              void navigate({
                to: "/design-systems/$designSystemId/$section",
                params: {
                  designSystemId: value,
                  section: designSystemSectionPathSegment(selectedDesignSystemSection),
                },
              });
          }}
        >
          <SelectTrigger
            aria-label="Select Design System"
            className="w-[320px] [&>span]:text-center"
          >
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {designSystems.data.length === 0 && (
              <SelectItem value={NO_DESIGN_SYSTEM} disabled>
                No Design Systems
              </SelectItem>
            )}
            {designSystems.data.map((designSystem) => (
              <SelectItem key={designSystem.id} value={designSystem.id}>
                {designSystem.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="h-10 w-[320px] animate-pulse rounded-md bg-onbrand-charcoal/5" />
      )}
    </header>
  );
};

const DashboardRail = ({
  selectedDesignSystemId,
  selectedDesignSystemSection,
}: Readonly<{
  selectedDesignSystemId?: string;
  selectedDesignSystemSection?: DesignSystemSection;
}>) => (
  <aside className="hidden w-16 shrink-0 flex-col items-center bg-onbrand-white px-2 py-5 text-onbrand-charcoal lg:flex">
    <div className="mb-6 grid h-9 w-9 place-items-center">
      <img alt="Onbrand" className="h-6 w-6" src={onbrandLogoUrl} />
    </div>
    <TooltipProvider delayDuration={150}>
      <nav className="flex flex-1 flex-col items-center gap-2" aria-label="Onbrand sections">
        {DESIGN_SYSTEM_SECTION_LINKS.map(({ section, pathSegment, label, icon }) => {
          const isActive =
            (selectedDesignSystemSection ?? DEFAULT_DESIGN_SYSTEM_SECTION) === section;
          const href = selectedDesignSystemId
            ? `/design-systems/${encodeURIComponent(selectedDesignSystemId)}/${pathSegment}`
            : "/design-systems";

          return (
            <Tooltip key={section}>
              <TooltipTrigger asChild>
                <Link
                  to={href}
                  aria-label={label}
                  aria-current={isActive ? "page" : undefined}
                  className={
                    isActive
                      ? "grid h-9 w-9 place-items-center rounded-md bg-onbrand-blue-50 text-onbrand-blue-600 shadow-[0_8px_22px_rgba(21,112,239,0.12)] ring-1 ring-onbrand-blue-200"
                      : "grid h-9 w-9 place-items-center rounded-md text-onbrand-charcoal transition hover:text-onbrand-blue-600"
                  }
                >
                  <HugeiconsIcon className="h-[18px] w-[18px]" icon={icon} strokeWidth={2} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  </aside>
);
