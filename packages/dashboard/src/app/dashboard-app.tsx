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
import { BrandGuideDetail } from "../brand-guide/detail/brand-guide-detail";
import type { BrandGuideSummary } from "@onbrand/core/brand-guide/application-service";
import {
  DEFAULT_BRAND_GUIDE_SECTION,
  BRAND_GUIDE_SECTION_LINKS,
  brandGuideSectionLabel,
  brandGuideSectionPathSegment,
  type BrandGuideSection,
} from "../brand-guide/navigation/brand-guide-sections";
import type { ApiState } from "../shared/api/api-state";
import { ErrorMessage } from "../shared/ui/feedback";
import onbrandLogoUrl from "../assets/onbrand-logo.svg";
import { routeFromPathname } from "./route";

const NO_BRAND_GUIDE = "NO_BRAND_GUIDE";
const GRAIN_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export const OnboardingPage = () => (
  <main className="relative min-h-screen overflow-hidden bg-[#020617] px-4 py-10 text-onbrand-charcoal sm:px-6 lg:px-8">
    <div
      aria-hidden
      className="animate-onbrand-gradient-drift absolute -inset-10"
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
      className="animate-onbrand-light-breathe absolute inset-0"
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
      className="animate-onbrand-aurora-sweep absolute -inset-24 mix-blend-screen blur-3xl"
      style={{
        background: `
          radial-gradient(42% 48% at 22% 52%, rgba(0, 24, 120, 0.92) 0%, transparent 72%),
          radial-gradient(44% 42% at 76% 24%, rgba(40, 188, 255, 0.88) 0%, transparent 70%),
          radial-gradient(38% 46% at 58% 78%, rgba(0, 84, 255, 0.7) 0%, transparent 74%)
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
      className="animate-onbrand-texture-drift absolute inset-0 opacity-20 mix-blend-overlay"
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
  const brandGuides = useApi<readonly BrandGuideSummary[]>("/api/brand-guides");
  const isHome = pathname === "/";
  const selectedBrandGuideId =
    route.selectedBrandGuideId ??
    (!isHome && brandGuides.status === "READY" ? brandGuides.data[0]?.id : undefined);
  const selectedBrandGuide =
    brandGuides.status === "READY"
      ? brandGuides.data.find((brandGuide) => brandGuide.id === selectedBrandGuideId)
      : undefined;

  return (
    <div className="min-h-screen bg-onbrand-white text-onbrand-charcoal">
      <div className="flex min-h-screen overflow-hidden border border-onbrand-charcoal/10 bg-onbrand-white shadow-[0_32px_120px_rgba(10,10,10,0.16)]">
        <DashboardRail
          selectedBrandGuideId={selectedBrandGuideId}
          selectedBrandGuideSection={route.selectedBrandGuideSection}
        />
        <div className="min-w-0 flex-1 border-l border-onbrand-charcoal/8 bg-onbrand-white">
          <DashboardTopBar
            brandGuides={brandGuides}
            selectedBrandGuideId={selectedBrandGuideId}
            selectedBrandGuideName={selectedBrandGuide?.name}
            selectedBrandGuideSection={route.selectedBrandGuideSection}
          />
          <main className="min-w-0 overflow-y-auto px-4 py-4 sm:px-6 lg:max-h-[calc(100vh-4rem)] lg:px-7 lg:py-5">
            {selectedBrandGuideId ? (
              <BrandGuideDetail
                id={selectedBrandGuideId}
                section={route.selectedBrandGuideSection}
              />
            ) : brandGuides.status === "ERROR" ? (
              <ErrorMessage message={brandGuides.message} />
            ) : brandGuides.status === "READY" ? (
              <NoBrandGuidesPrompt />
            ) : (
              <p className="text-onbrand-charcoal/45">Loading your Brand Guides…</p>
            )}
          </main>
        </div>
      </div>
      <Toaster position="bottom-right" visibleToasts={4} />
    </div>
  );
};

const NoBrandGuidesPrompt = () => (
  <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
    <div className="-translate-y-10 text-center">
      <h2 className="text-base font-normal text-onbrand-charcoal">Prompt your agent</h2>
      <CopyableValue value="How can I create a brand guide?" className="mx-auto mt-2" />
    </div>
  </section>
);

const OnboardingInstructions = ({
  variant = "light",
}: Readonly<{ variant?: "light" | "dark" }>) => {
  const mcpUrl = "https://onbrand.slidespeak.co/mcp";
  const connections = [
    {
      name: "Codex",
      icon: "codex",
      value: `codex mcp add onbrand --url ${mcpUrl}`,
    },
    {
      name: "Claude Code",
      icon: "claude",
      value: `claude mcp add --transport http onbrand ${mcpUrl}`,
    },
    {
      name: "Cursor",
      icon: "cursor",
      value: `{
  "mcpServers": {
    "onbrand": {
      "url": "${mcpUrl}"
    }
  }
}`,
    },
  ] as const satisfies readonly { name: string; value: string; icon: McpClientIconName }[];

  return (
    <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center">
      <div className="w-full -translate-y-10 p-2 text-center sm:p-4">
        <div className="grid gap-12">
          <OnboardingStep number="01" title="Connect to the OnBrand MCP" variant={variant}>
            <ConnectionOptions connections={connections} variant={variant} />
          </OnboardingStep>
          <OnboardingStep
            number="02"
            title="Restart your agent. Then prompt:"
            value="Tell me about OnBrand"
            variant={variant}
          />
          <OnboardingStep
            number="03"
            value="Start Creating"
            href="/brand-guides"
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
  connections: readonly { name: string; value: string; icon: McpClientIconName }[];
  variant: "light" | "dark";
}>) => {
  const [selectedConnectionName, setSelectedConnectionName] = useState(connections[0]?.name);
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
                  : "grid cursor-pointer place-items-center rounded-md bg-white p-2 text-onbrand-charcoal"
              }
            >
              <McpClientIcon
                className={isSelected ? "h-8 w-8 text-white" : "h-8 w-8 text-onbrand-charcoal"}
                name={connection.icon}
              />
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
    try {
      if (!navigator.clipboard) {
        toast.error("Clipboard not available");
        return;
      }

      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const variantClasses =
    variant === "dark"
      ? "border-white bg-onbrand-charcoal text-white hover:bg-white hover:text-onbrand-charcoal"
      : "border-onbrand-charcoal bg-onbrand-charcoal text-white hover:bg-black hover:text-white";

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={`group inline-grid min-h-12 max-w-full cursor-pointer grid-cols-[minmax(0,max-content)_auto] items-center gap-3 rounded-md border-[0.5px] px-4 py-3 text-left transition ${variantClasses} ${className}`}
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

type McpClientIconName = "claude" | "codex" | "cursor";

const McpClientIcon = ({
  name,
  className,
}: Readonly<{ name: McpClientIconName; className?: string }>) => {
  if (name === "claude") return <ClaudeCodeIcon className={className} />;
  if (name === "codex") return <CodexIcon className={className} />;
  return <CursorIcon className={className} />;
};

const ClaudeCodeIcon = ({ className }: Readonly<{ className?: string }>) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="m4.71 15.96 4.72-2.65.08-.23-.08-.13H9.2l-.79-.05-2.7-.07-2.33-.1-2.27-.12-.57-.12-.53-.7.05-.36.48-.32.69.06 1.52.1 2.27.16 1.66.1 2.44.25h.4l.05-.15-.14-.1-.1-.1-2.36-1.6-2.55-1.68-1.33-.97-.73-.5L2 6.22l-.16-1 .66-.73.88.06.22.06.9.69 1.9 1.48L8.9 8.6l.36.3.14-.1.02-.07-.16-.28L7.9 6.02l-1.44-2.5L5.8 2.5l-.17-.62c-.06-.26-.1-.47-.1-.73L6.29.13 6.7 0l1 .13.41.37.62 1.41 1 2.23 1.56 3.03.45.9.25.83.09.26h.16V9l.12-1.7.24-2.1.23-2.7.08-.76.38-.9.74-.5.59.28.48.69-.07.44-.29 1.85-.55 2.9-.37 1.95h.21l.25-.25.98-1.3 1.65-2.07.73-.81.85-.9.55-.44h1.03l.76 1.13-.34 1.16-1.06 1.35-.89 1.14-1.26 1.7-.79 1.36.08.11.18-.02 2.86-.6 1.54-.28 1.84-.32.83.4.1.39-.34.8-1.96.49-2.31.46-3.44.81-.04.03.05.07 1.55.14.66.04h1.62l3.02.22.79.52.47.64-.08.49-1.21.62-1.64-.4-3.83-.9-1.3-.33h-.19v.1l1.1 1.08 2 1.8 2.5 2.34.13.57-.32.46-.34-.05-2.2-1.66-.85-.74-1.93-1.62h-.13v.17l.45.65 2.34 3.52.12 1.08-.17.35-.6.21-.67-.12-1.38-1.92-1.41-2.17-1.14-1.94-.14.08-.68 7.25-.31.37-.73.28-.6-.46-.33-.75.32-1.47.4-1.93.3-1.53.3-1.9.16-.63v-.04l-.15.02-1.43 1.96-2.18 2.95-1.73 1.84-.4.17-.72-.37.06-.66.4-.6 2.39-3.03 1.44-1.88.93-1.09v-.16h-.06l-6.34 4.12-1.13.15-.49-.46.06-.75.23-.24 1.91-1.31Z" />
  </svg>
);

const CodexIcon = ({ className }: Readonly<{ className?: string }>) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M9.2 8.66V6.4q0-.3.24-.43L14 3.35a4 4 0 0 1 2.11-.52 4.54 4.54 0 0 1 4.67 4.57q0 .25-.03.54l-4.7-2.76a.8.8 0 0 0-.87 0zm10.61 8.8v-5.4a.8.8 0 0 0-.42-.74l-5.97-3.47 1.95-1.12a.4.4 0 0 1 .47 0l4.54 2.62a4.7 4.7 0 0 1 2.2 3.95c0 1.8-1.08 3.47-2.77 4.16zm-12-4.76-1.96-1.14a.5.5 0 0 1-.24-.43V5.9a4.4 4.4 0 0 1 4.6-4.47q1.52.02 2.7.92L8.24 5.07a.8.8 0 0 0-.43.73zM12 15.13l-2.8-1.57v-3.33L12 8.66l2.8 1.57v3.33zm1.8 7.23q-1.52-.02-2.72-.93l4.69-2.71a.8.8 0 0 0 .43-.74v-6.9l1.97 1.15q.25.14.24.42v5.24a4.44 4.44 0 0 1-4.61 4.47zm-5.64-5.3L3.6 14.43a4.7 4.7 0 0 1-2.18-3.95A4.5 4.5 0 0 1 4.2 6.33v5.42q0 .49.43.74l5.95 3.45-1.95 1.12a.4.4 0 0 1-.48 0m-.26 3.9a4.5 4.5 0 0 1-4.67-4.52q.01-.3.05-.57l4.69 2.7a.8.8 0 0 0 .85 0l5.97-3.44v2.26q0 .28-.23.43L10 20.43q-.95.53-2.11.52m5.9 2.82a5.95 5.95 0 0 0 5.82-4.75A5.96 5.96 0 0 0 22 8.85q.19-.75.2-1.5a5.93 5.93 0 0 0-7.83-5.64A6 6 0 0 0 10.2 0a5.95 5.95 0 0 0-5.83 4.76A5.95 5.95 0 0 0 2 14.94q-.19.75-.2 1.5a5.93 5.93 0 0 0 7.83 5.63 6 6 0 0 0 4.17 1.72z"
    />
  </svg>
);

const CursorIcon = ({ className }: Readonly<{ className?: string }>) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z" />
  </svg>
);

const DashboardTopBar = ({
  brandGuides,
  selectedBrandGuideId,
  selectedBrandGuideName,
  selectedBrandGuideSection = DEFAULT_BRAND_GUIDE_SECTION,
}: Readonly<{
  brandGuides: ApiState<readonly BrandGuideSummary[]>;
  selectedBrandGuideId?: string;
  selectedBrandGuideName?: string;
  selectedBrandGuideSection?: BrandGuideSection;
}>) => {
  const navigate = useNavigate();

  return (
    <header className="flex h-16 items-center gap-4 border-b border-onbrand-charcoal/8 px-4 sm:px-6 lg:px-7">
      <div className="flex min-w-0 flex-1 items-center gap-3 text-sm">
        <span className="truncate font-normal text-onbrand-charcoal">
          {selectedBrandGuideName ?? "Getting started"}
        </span>
        {selectedBrandGuideName ? (
          <>
            <span className="text-onbrand-charcoal/25">/</span>
            <span className="truncate text-onbrand-charcoal/55">
              {brandGuideSectionLabel(selectedBrandGuideSection)}
            </span>
          </>
        ) : null}
      </div>
      {brandGuides.status === "READY" ? (
        <Select
          value={selectedBrandGuideId ?? NO_BRAND_GUIDE}
          onValueChange={(value) => {
            if (value !== NO_BRAND_GUIDE)
              void navigate({
                to: "/brand-guides/$brandGuideId/$section",
                params: {
                  brandGuideId: value,
                  section: brandGuideSectionPathSegment(selectedBrandGuideSection),
                },
              });
          }}
        >
          <SelectTrigger aria-label="Select Brand Guide" className="w-[320px] [&>span]:text-center">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {!selectedBrandGuideId && (
              <SelectItem value={NO_BRAND_GUIDE} disabled>
                {brandGuides.data.length === 0 ? "No Brand Guides" : "Select Brand Guide"}
              </SelectItem>
            )}
            {brandGuides.data.map((brandGuide) => (
              <SelectItem key={brandGuide.id} value={brandGuide.id}>
                {brandGuide.name}
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
  selectedBrandGuideId,
  selectedBrandGuideSection,
}: Readonly<{
  selectedBrandGuideId?: string;
  selectedBrandGuideSection?: BrandGuideSection;
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
        {BRAND_GUIDE_SECTION_LINKS.map(({ section, pathSegment, label, icon }) => {
          const isActive =
            Boolean(selectedBrandGuideId) &&
            (selectedBrandGuideSection ?? DEFAULT_BRAND_GUIDE_SECTION) === section;
          const href = selectedBrandGuideId
            ? `/brand-guides/${encodeURIComponent(selectedBrandGuideId)}/${pathSegment}`
            : "/brand-guides";

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
