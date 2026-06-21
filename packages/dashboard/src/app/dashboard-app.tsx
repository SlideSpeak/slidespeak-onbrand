import { type FormEvent, type ReactNode, useEffect, useReducer, useRef, useState } from "react";
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
import { Dialog, DialogContent, DialogTitle } from "../components/ui/dialog";
import { Toaster } from "../components/ui/sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { toast } from "sonner";
import { sendJson, useApi } from "../shared/api/api-state";
import { publishBrandGuideUpdated, useSyncedBrandGuides } from "../shared/brand-guide-sync";
import { BrandGuideDetail } from "../brand-guide/detail/brand-guide-detail";
import type {
  BrandGuideSummary,
  BrandGuideView,
} from "@onbrand/core/brand-guide/application-service";
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
import { onboardingConnections } from "./runtime-config";
import { ThemeToggle } from "./theme-toggle";
import { type ThemeMode, useDashboardTheme } from "./theme";

const NO_BRAND_GUIDE = "NO_BRAND_GUIDE";
const GRAIN_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export const OnboardingPage = () => (
  <main className="onbrand-static-light-tokens relative min-h-screen overflow-hidden bg-[#020617] px-4 py-10 text-onbrand-charcoal sm:px-6 lg:px-8">
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
  const loadedBrandGuides = useApi<readonly BrandGuideSummary[]>("/api/brand-guides");
  const brandGuides = useSyncedBrandGuides(loadedBrandGuides);
  const { setTheme, theme } = useDashboardTheme();
  const isHome = pathname === "/home";
  const selectedBrandGuideId =
    route.selectedBrandGuideId ??
    (!isHome && brandGuides.status === "READY" ? brandGuides.data[0]?.id : undefined);
  const selectedBrandGuide =
    brandGuides.status === "READY"
      ? brandGuides.data.find((brandGuide) => brandGuide.id === selectedBrandGuideId)
      : undefined;

  if (isHome) {
    return (
      <div className="min-h-screen bg-onbrand-white text-onbrand-charcoal">
        <div className="flex min-h-screen overflow-hidden bg-onbrand-white">
          <DashboardRail />
          <div className="min-w-0 flex-1 bg-onbrand-white">
            <HomeTopBar />
            <main className="min-w-0 overflow-y-auto px-4 py-4 sm:px-6 lg:h-[calc(100vh-4rem)] lg:px-7 lg:py-5">
              {brandGuides.status === "ERROR" ? (
                <ErrorMessage message={brandGuides.message} />
              ) : brandGuides.status === "READY" ? (
                <HomeDashboard brandGuides={brandGuides.data} />
              ) : (
                <p className="text-onbrand-charcoal/45">Loading your Brand Guides…</p>
              )}
            </main>
          </div>
        </div>
        <Toaster variant="dark" position="bottom-right" visibleToasts={4} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-onbrand-canvas text-onbrand-charcoal">
      <div className="flex min-h-screen overflow-hidden border border-onbrand-charcoal/10 bg-onbrand-panel shadow-[0_32px_120px_rgba(10,10,10,0.16)]">
        <DashboardRail
          selectedBrandGuideId={selectedBrandGuideId}
          selectedBrandGuideSection={route.selectedBrandGuideSection}
        />
        <div className="min-w-0 flex-1 bg-onbrand-white">
          <DashboardTopBar
            brandGuides={brandGuides}
            selectedBrandGuideId={selectedBrandGuideId}
            selectedBrandGuide={selectedBrandGuide}
            selectedBrandGuideSection={route.selectedBrandGuideSection}
            onThemeChange={setTheme}
            theme={theme}
          />
          <main
            className={`min-w-0 px-4 py-4 sm:px-6 lg:h-[calc(100vh-4rem)] lg:px-7 lg:py-5 ${route.selectedBrandGuideSection === "PRESENTATION" ? "overflow-hidden" : "overflow-y-auto"}`}
          >
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
      <Toaster variant="dark" position="bottom-right" visibleToasts={4} />
    </div>
  );
};

const HomeTopBar = () => (
  <header className="flex h-16 items-center border-b border-onbrand-charcoal/8 px-4 sm:px-6 lg:px-7">
    <h1 className="text-sm font-medium tracking-[-0.02em] text-onbrand-charcoal">
      Welcome to OnBrand by SlideSpeak
    </h1>
  </header>
);

const HomeDashboard = ({
  brandGuides,
}: Readonly<{ brandGuides: readonly BrandGuideSummary[] }>) => {
  if (brandGuides.length === 0) return <NoBrandGuidesPrompt />;

  return (
    <section className="grid gap-3">
      <div className="flex min-h-10 items-center justify-between gap-4">
        <h1 className="m-0 text-xl leading-none font-normal tracking-[-0.035em] text-onbrand-charcoal">
          Brand Guides
        </h1>
        <CreateBrandGuideButton />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
        {brandGuides.map((brandGuide) => (
          <HomeBrandGuideTile key={brandGuide.id} brandGuide={brandGuide} />
        ))}
      </div>
    </section>
  );
};

const HomeBrandGuideTile = ({ brandGuide }: Readonly<{ brandGuide: BrandGuideSummary }>) => {
  const detail = useApi<BrandGuideView>(`/api/brand-guides/${encodeURIComponent(brandGuide.id)}`);
  const colors = detail.status === "READY" ? detail.data.brandKit.colors.slice(0, 9) : [];
  const logo = detail.status === "READY" ? detail.data.brandKit.logo : null;

  return (
    <div className="group relative overflow-hidden rounded-md border border-onbrand-charcoal/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-onbrand-blue-200 hover:shadow-md">
      <Link
        to="/brand-guides/$brandGuideId/$section"
        params={{ brandGuideId: brandGuide.id, section: "colors" }}
        className="grid"
      >
        <div className="aspect-square overflow-hidden">
          {logo ? (
            <HomeLogoPreview
              src={`/api/brand-guides/${encodeURIComponent(brandGuide.id)}/assets/${encodeURIComponent(logo.assetHandle)}/preview-proxy`}
            />
          ) : (
            <div className="grid h-full place-items-center bg-onbrand-charcoal/[0.035] text-xs text-onbrand-charcoal/35">
              No logo
            </div>
          )}
        </div>
        <h2 className="truncate px-2 py-1.5 text-xs font-medium tracking-[-0.02em] text-onbrand-charcoal">
          {brandGuide.name}
        </h2>
        <div className="grid grid-cols-9 border-t border-onbrand-charcoal/10">
          {Array.from({ length: 9 }, (_, index) => {
            const color = colors[index];
            return (
              <span
                key={color?.id ?? index}
                className="aspect-square bg-onbrand-charcoal/[0.04]"
                style={color ? { backgroundColor: color.value } : undefined}
              />
            );
          })}
        </div>
      </Link>
    </div>
  );
};

const HomeLogoPreview = ({ src }: Readonly<{ src: string }>) => {
  const [background, setBackground] = useState<"white" | "charcoal">("white");

  const chooseBackground = (image: HTMLImageElement) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 48;
      canvas.height = 48;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let weightedLuminance = 0;
      let alphaTotal = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        const alpha = pixels[index + 3] / 255;
        if (alpha < 0.08) continue;
        weightedLuminance +=
          (0.2126 * (pixels[index] / 255) +
            0.7152 * (pixels[index + 1] / 255) +
            0.0722 * (pixels[index + 2] / 255)) *
          alpha;
        alphaTotal += alpha;
      }
      if (alphaTotal > 0)
        setBackground(weightedLuminance / alphaTotal > 0.58 ? "charcoal" : "white");
    } catch {
      setBackground("white");
    }
  };

  return (
    <div className={background === "charcoal" ? "h-full bg-onbrand-charcoal" : "h-full bg-white"}>
      <img
        alt=""
        className="h-full w-full object-contain p-3"
        src={src}
        onLoad={(event) => chooseBackground(event.currentTarget)}
      />
    </div>
  );
};

const NoBrandGuidesPrompt = () => (
  <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
    <div className="-translate-y-10 text-center">
      <CreateBrandGuideButton />
      <div className="my-5 text-xs tracking-[0.22em] text-onbrand-charcoal/35 uppercase">Or</div>
      <h2 className="text-base font-normal text-onbrand-charcoal">Prompt your agent</h2>
      <CopyableValue value="How can I create a brand guide?" className="mx-auto mt-2" />
    </div>
  </section>
);

type CreateBrandGuideState = {
  open: boolean;
  name: string;
  error?: string;
  submitting: boolean;
};

const createBrandGuideInitialState: CreateBrandGuideState = {
  open: false,
  name: "",
  submitting: false,
};

const CreateBrandGuideButton = () => {
  const [state, setState] = useReducer(
    (current: CreateBrandGuideState, patch: Partial<CreateBrandGuideState>) => ({
      ...current,
      ...patch,
    }),
    createBrandGuideInitialState,
  );

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setState({ error: undefined, submitting: true });
    try {
      const view = await sendJson<{ brandGuide: BrandGuideSummary }>("/api/brand-guides", {
        method: "POST",
        body: { name: state.name, description: null },
      });
      publishBrandGuideUpdated(view.brandGuide);
      window.location.href = `/brand-guides/${encodeURIComponent(view.brandGuide.id)}/colors`;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      setState({ error: message, submitting: false });
      toast.error("Could not create Brand Guide", { description: message });
      return;
    }
    setState({ submitting: false });
  };

  return (
    <Dialog open={state.open} onOpenChange={(open) => setState({ open })}>
      <button
        className="rounded-md bg-onbrand-charcoal px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-black disabled:opacity-50"
        type="button"
        onClick={() => setState({ open: true })}
      >
        Create Brand Guide
      </button>
      <DialogContent>
        <form className="grid gap-5 p-6" onSubmit={create}>
          <div>
            <DialogTitle className="text-lg font-medium text-onbrand-charcoal">
              Create Brand Guide
            </DialogTitle>
          </div>
          <label className="grid gap-2 text-sm text-onbrand-charcoal">
            Name
            <input
              required
              className="rounded-md border border-onbrand-charcoal/15 px-3 py-2 outline-none"
              value={state.name}
              onChange={(event) => setState({ name: event.target.value })}
            />
          </label>
          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          <div className="flex justify-end gap-2">
            <button
              className="rounded-md px-4 py-2 text-sm text-onbrand-charcoal/65"
              type="button"
              onClick={() => setState({ open: false })}
            >
              Cancel
            </button>
            <button
              className="rounded-md bg-onbrand-charcoal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={state.submitting || !state.name.trim()}
              type="submit"
            >
              {state.submitting ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const OnboardingInstructions = ({
  variant = "light",
}: Readonly<{ variant?: "light" | "dark" }>) => {
  const connections = onboardingConnections();

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
      : "border-onbrand-inverse bg-onbrand-inverse text-onbrand-inverse-foreground hover:bg-onbrand-blue-600 hover:text-white";

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

const EditableBrandGuideName = ({ brandGuide }: Readonly<{ brandGuide?: BrandGuideSummary }>) => {
  const [name, setName] = useState(brandGuide?.name ?? "");
  const editedByUser = useRef(false);

  useEffect(() => {
    if (!brandGuide || !editedByUser.current || !name.trim() || name === brandGuide.name) return;
    const timeout = window.setTimeout(() => {
      sendJson<BrandGuideView>(`/api/brand-guides/${encodeURIComponent(brandGuide.id)}/metadata`, {
        method: "PATCH",
        body: { name },
      })
        .then((saved) => {
          editedByUser.current = false;
          publishBrandGuideUpdated(saved.brandGuide);
          toast.success("Changes saved");
        })
        .catch((error: unknown) =>
          toast.error("Could not rename Brand Guide", {
            description: error instanceof Error ? error.message : String(error),
          }),
        );
    }, 650);
    return () => window.clearTimeout(timeout);
  }, [brandGuide, name]);
  if (!brandGuide)
    return <span className="truncate font-normal text-onbrand-charcoal">Getting started</span>;
  return (
    <label className="relative inline-grid max-w-[min(42rem,45vw)] flex-none items-center overflow-hidden">
      <span className="invisible font-normal whitespace-pre" aria-hidden>
        {name || brandGuide.name || "Brand Guide"}
      </span>
      <input
        aria-label="Brand Guide name"
        className="absolute inset-0 w-full bg-transparent font-normal text-onbrand-charcoal transition outline-none"
        spellCheck={false}
        value={name}
        onChange={(e) => {
          editedByUser.current = true;
          setName(e.target.value);
        }}
      />
    </label>
  );
};

const DashboardTopBar = ({
  brandGuides,
  onThemeChange,
  selectedBrandGuideId,
  selectedBrandGuide,
  selectedBrandGuideSection = DEFAULT_BRAND_GUIDE_SECTION,
  theme,
}: Readonly<{
  brandGuides: ApiState<readonly BrandGuideSummary[]>;
  onThemeChange: (theme: ThemeMode) => void;
  selectedBrandGuideId?: string;
  selectedBrandGuide?: BrandGuideSummary;
  selectedBrandGuideSection?: BrandGuideSection;
  theme: ThemeMode;
}>) => {
  const navigate = useNavigate();

  return (
    <header className="flex h-16 items-center gap-3 border-b border-onbrand-charcoal/8 bg-onbrand-white px-4 sm:gap-4 sm:px-6 lg:px-7">
      <Link
        to="/home"
        aria-label="Onbrand dashboard home"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md transition hover:bg-onbrand-charcoal/5 lg:hidden"
      >
        <img alt="Onbrand" className="onbrand-dashboard-logo h-6 w-6" src={onbrandLogoUrl} />
      </Link>
      <div className="flex min-w-0 flex-1 items-center gap-3 text-sm">
        <EditableBrandGuideName
          key={selectedBrandGuide ? `${selectedBrandGuide.id}:${selectedBrandGuide.name}` : "empty"}
          brandGuide={selectedBrandGuide}
        />
        {selectedBrandGuide ? (
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
          <SelectTrigger
            aria-label="Select Brand Guide"
            className="w-[min(320px,38vw)] min-w-32 [&>span]:text-center"
          >
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
        <div className="h-10 w-[min(320px,38vw)] min-w-32 animate-pulse rounded-md bg-onbrand-charcoal/5" />
      )}
      <ThemeToggle onThemeChange={onThemeChange} theme={theme} />
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
  <aside className="hidden w-16 shrink-0 flex-col items-center bg-onbrand-panel px-2 py-5 text-onbrand-charcoal lg:flex">
    <Link
      to="/home"
      aria-label="Onbrand home"
      className="mb-6 grid h-9 w-9 place-items-center rounded-md transition hover:bg-onbrand-charcoal/5"
    >
      <img alt="Onbrand" className="onbrand-dashboard-logo h-6 w-6" src={onbrandLogoUrl} />
    </Link>
    {selectedBrandGuideId ? (
      <TooltipProvider delayDuration={150}>
        <nav className="flex flex-1 flex-col items-center gap-2" aria-label="Brand Guide sections">
          {BRAND_GUIDE_SECTION_LINKS.map(({ section, pathSegment, label, icon }) => {
            if (section === "METADATA") return null;
            const isActive = (selectedBrandGuideSection ?? DEFAULT_BRAND_GUIDE_SECTION) === section;
            return (
              <Tooltip key={section}>
                <TooltipTrigger asChild>
                  <Link
                    to="/brand-guides/$brandGuideId/$section"
                    params={{ brandGuideId: selectedBrandGuideId, section: pathSegment }}
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
          {(() => {
            const metadataLink = BRAND_GUIDE_SECTION_LINKS.find(
              ({ section }) => section === "METADATA",
            );
            if (!metadataLink) return null;
            const { section, pathSegment, label, icon } = metadataLink;
            const isActive = selectedBrandGuideSection === section;
            return (
              <Tooltip key={section}>
                <TooltipTrigger asChild>
                  <Link
                    to="/brand-guides/$brandGuideId/$section"
                    params={{ brandGuideId: selectedBrandGuideId, section: pathSegment }}
                    aria-label={label}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      isActive
                        ? "mt-auto grid h-9 w-9 place-items-center rounded-md bg-onbrand-blue-50 text-onbrand-blue-600 shadow-[0_8px_22px_rgba(21,112,239,0.12)] ring-1 ring-onbrand-blue-200"
                        : "mt-auto grid h-9 w-9 place-items-center rounded-md text-onbrand-charcoal transition hover:text-onbrand-blue-600"
                    }
                  >
                    <HugeiconsIcon className="h-[18px] w-[18px]" icon={icon} strokeWidth={2} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          })()}
        </nav>
      </TooltipProvider>
    ) : null}
  </aside>
);
