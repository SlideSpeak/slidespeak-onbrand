import { type ReactNode, useState } from "react";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Toaster } from "../components/ui/sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { toast } from "sonner";
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
import { ErrorMessage } from "../shared/ui/feedback";
import claudeCodeIconUrl from "../assets/claude-code-icon.svg";
import codexIconUrl from "../assets/codex-icon.svg";
import cursorIconUrl from "../assets/cursor-icon.svg";
import onbrandLogoUrl from "../assets/onbrand-logo.svg";
import { routeFromPathname } from "./route";

const NO_DESIGN_SYSTEM = "NO_DESIGN_SYSTEM";
const GRAIN_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export const OnboardingPage = () => (
  <main className="relative min-h-screen overflow-hidden bg-[#020617] px-4 py-10 text-onbrand-charcoal sm:px-6 lg:px-8">
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background: `
          radial-gradient(90% 85% at 28% 68%, rgba(1, 8, 33, 0.96) 0%, rgba(2, 13, 49, 0.78) 34%, rgba(3, 21, 76, 0.3) 58%, transparent 76%),
          radial-gradient(95% 90% at 58% 58%, rgba(1, 22, 77, 0.74) 0%, rgba(3, 36, 128, 0.45) 32%, transparent 66%),
          radial-gradient(70% 80% at 88% 25%, rgba(22, 155, 255, 0.84) 0%, rgba(0, 102, 255, 0.55) 34%, transparent 72%),
          radial-gradient(85% 70% at 54% 0%, rgba(29, 172, 255, 0.78) 0%, rgba(11, 112, 255, 0.62) 38%, transparent 78%),
          radial-gradient(54% 70% at 4% 8%, rgba(0, 42, 132, 0.9) 0%, rgba(2, 20, 70, 0.72) 48%, transparent 80%),
          linear-gradient(112deg, #02091f 0%, #06276f 26%, #055cf4 50%, #0787ff 72%, #0525b7 100%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 22%, rgba(0, 0, 0, 0.38) 100%)
        `,
      }}
    />
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background: `
          radial-gradient(140% 110% at 52% 44%, transparent 40%, rgba(1, 4, 16, 0.34) 72%, rgba(0, 2, 12, 0.82) 100%),
          linear-gradient(90deg, rgba(0, 0, 0, 0.58) 0%, transparent 20%, transparent 76%, rgba(0, 2, 18, 0.42) 100%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 16%, transparent 68%, rgba(0, 0, 0, 0.58) 100%)
        `,
      }}
    />
    <div
      aria-hidden
      className="absolute inset-0 opacity-100 mix-blend-soft-light"
      style={{ backgroundImage: GRAIN_TEXTURE, backgroundSize: "88px 88px" }}
    />
    <div
      aria-hidden
      className="absolute inset-0 opacity-20 mix-blend-overlay"
      style={{
        backgroundImage: `
          linear-gradient(100deg, transparent 0 23%, rgba(255,255,255,0.18) 23.08%, transparent 23.18% 100%),
          linear-gradient(74deg, transparent 0 61%, rgba(255,255,255,0.12) 61.08%, transparent 61.18% 100%),
          linear-gradient(166deg, transparent 0 39%, rgba(0,0,0,0.26) 39.08%, transparent 39.18% 100%)
        `,
        backgroundSize: "420px 280px, 520px 360px, 460px 320px",
      }}
    />
    <div className="relative z-10">
      <OnboardingInstructions variant="dark" />
    </div>
    <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2 text-base font-semibold text-white">
      <img alt="" className="h-[1em] w-[1em] invert" src={onbrandLogoUrl} />
      <span>OnBrand</span>
    </div>
    <Toaster position="bottom-right" visibleToasts={4} />
  </main>
);

export const DashboardApp = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const route = routeFromPathname(pathname);
  const designSystems = useApi<readonly DesignSystemSummary[]>("/api/design-systems");
  const isHome = pathname === "/";
  const selectedDesignSystemId =
    route.selectedDesignSystemId ??
    (!isHome && designSystems.status === "READY" ? designSystems.data[0]?.id : undefined);
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
              <OnboardingInstructions />
            ) : (
              <p className="text-onbrand-charcoal/45">Loading your Design Systems…</p>
            )}
          </main>
        </div>
      </div>
      <Toaster position="bottom-right" visibleToasts={4} />
    </div>
  );
};

const OnboardingInstructions = ({
  variant = "light",
}: Readonly<{ variant?: "light" | "dark" }>) => {
  const mcpUrl = "https://onbrand.slidespeak.co/mcp";
  const connections = [
    {
      name: "Codex",
      iconUrl: codexIconUrl,
      value: `codex mcp add onbrand --url ${mcpUrl}`,
    },
    {
      name: "Claude Code",
      iconUrl: claudeCodeIconUrl,
      value: `claude mcp add --transport http onbrand ${mcpUrl}`,
    },
    {
      name: "Cursor",
      iconUrl: cursorIconUrl,
      value: `{
  "mcpServers": {
    "onbrand": {
      "url": "${mcpUrl}"
    }
  }
}`,
    },
  ];

  return (
    <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center">
      <div className="w-full -translate-y-10 p-2 text-center sm:p-4">
        <div className="grid gap-12">
          <OnboardingStep number="01" title="Connect to the OnBrand MCP" variant={variant}>
            <ConnectionOptions connections={connections} variant={variant} />
          </OnboardingStep>
          <OnboardingStep
            number="02"
            title="Prompt your agent"
            value="Tell me about OnBrand"
            variant={variant}
          />
          <OnboardingStep
            number="03"
            value="View Design Systems"
            href="/design-systems"
            variant={variant}
          />
        </div>
      </div>
    </section>
  );
};

const OnboardingStep = ({
  number,
  title,
  value,
  href,
  children,
  variant = "light",
}: Readonly<{
  number: string;
  title?: string;
  value?: string;
  href?: string;
  children?: ReactNode;
  variant?: "light" | "dark";
}>) => {
  const isDark = variant === "dark";

  return (
    <div className="min-w-0 text-center">
      <div
        className={
          isDark
            ? "mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-md text-xl font-semibold text-white"
            : "mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-md text-xl font-semibold text-onbrand-charcoal"
        }
      >
        {number}
      </div>
      {title ? (
        <h2
          className={
            isDark
              ? "text-base font-normal text-white"
              : "text-base font-normal text-onbrand-charcoal"
          }
        >
          {title}
        </h2>
      ) : null}
      {children ??
        (href ? (
          <Link
            to={href}
            className="mt-2 inline-flex h-14 cursor-pointer items-center justify-center rounded-md border-[0.5px] border-onbrand-charcoal bg-white px-6 text-lg text-onbrand-charcoal transition hover:bg-onbrand-charcoal hover:text-white"
          >
            {value}
          </Link>
        ) : value ? (
          <CopyableValue value={value} variant={variant} className="mx-auto mt-2" />
        ) : null)}
    </div>
  );
};

const ConnectionOptions = ({
  connections,
  variant,
}: Readonly<{
  connections: readonly { name: string; value: string; iconUrl?: string }[];
  variant: "light" | "dark";
}>) => {
  const [selectedConnectionName, setSelectedConnectionName] = useState(connections[0]?.name);
  const isDark = variant === "dark";
  const selectedConnection =
    connections.find((connection) => connection.name === selectedConnectionName) ?? connections[0];

  if (!selectedConnection) return null;

  return (
    <div className="mt-3 grid justify-items-center gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        {connections.map((connection) => {
          const isSelected = connection.name === selectedConnection.name;

          return (
            <button
              key={connection.name}
              type="button"
              aria-pressed={isSelected}
              aria-label={connection.name}
              title={connection.name}
              onClick={() => setSelectedConnectionName(connection.name)}
              className={
                isSelected
                  ? "grid cursor-pointer place-items-center rounded-md bg-onbrand-charcoal p-2 text-white"
                  : isDark
                    ? "grid cursor-pointer place-items-center rounded-md bg-white p-2 text-onbrand-charcoal"
                    : "grid cursor-pointer place-items-center rounded-md bg-white p-2 text-onbrand-charcoal"
              }
            >
              {connection.iconUrl ? (
                <img
                  alt=""
                  className={isSelected ? "h-8 w-8 brightness-0 invert" : "h-8 w-8 brightness-0"}
                  src={connection.iconUrl}
                />
              ) : (
                <span className="text-sm font-normal">C</span>
              )}
            </button>
          );
        })}
      </div>

      <CopyableValue value={selectedConnection.value} variant={variant} className="mx-auto" />
    </div>
  );
};

const CopyableValue = ({
  value,
  variant = "light",
  className = "",
}: Readonly<{ value: string; variant?: "light" | "dark"; className?: string }>) => {
  const copy = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(value);
    }
    toast.success("Copied to clipboard");
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={`${
        variant === "dark"
          ? "bg-onbrand-charcoal text-white hover:bg-white hover:text-onbrand-charcoal"
          : "bg-onbrand-charcoal text-white hover:bg-white hover:text-onbrand-charcoal"
      } group inline-grid min-h-12 max-w-full cursor-pointer grid-cols-[minmax(0,max-content)_auto] items-center gap-3 rounded-md border-[0.5px] border-white px-4 py-3 text-left transition ${className}`}
    >
      <code className="max-w-[min(42rem,calc(100vw-3rem))] overflow-hidden font-mono text-base leading-6 text-ellipsis whitespace-nowrap">
        {value}
      </code>
      <span className="flex items-center gap-2 text-xs">
        <HugeiconsIcon className="h-4 w-4" icon={Copy01Icon} strokeWidth={2} />
      </span>
    </button>
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
          {selectedDesignSystemName ?? "Getting started"}
        </span>
        {selectedDesignSystemName ? (
          <>
            <span className="text-onbrand-charcoal/25">/</span>
            <span className="truncate text-onbrand-charcoal/55">
              {designSystemSectionLabel(selectedDesignSystemSection)}
            </span>
          </>
        ) : null}
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
            {!selectedDesignSystemId && (
              <SelectItem value={NO_DESIGN_SYSTEM} disabled>
                {designSystems.data.length === 0 ? "No Design Systems" : "Select Design System"}
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
    <Link
      to="/"
      aria-label="Onbrand home"
      className="mb-6 grid h-9 w-9 place-items-center rounded-md transition hover:bg-onbrand-charcoal/5"
    >
      <img alt="Onbrand" className="h-6 w-6" src={onbrandLogoUrl} />
    </Link>
    <TooltipProvider delayDuration={150}>
      <nav className="flex flex-1 flex-col items-center gap-2" aria-label="Onbrand sections">
        {DESIGN_SYSTEM_SECTION_LINKS.map(({ section, pathSegment, label, icon }) => {
          const isActive =
            Boolean(selectedDesignSystemId) &&
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
