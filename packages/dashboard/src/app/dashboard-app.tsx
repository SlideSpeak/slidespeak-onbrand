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
import onbrandLogoUrl from "../assets/onbrand-logo.svg";
import { routeFromPathname } from "./route";

const NO_DESIGN_SYSTEM = "NO_DESIGN_SYSTEM";
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
            title="Prompt your agent"
            value="Tell me about OnBrand"
            variant={variant}
          />
          <OnboardingStep
            number="03"
            value="Start Creating"
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

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={`group inline-grid min-h-12 max-w-full cursor-pointer grid-cols-[minmax(0,max-content)_auto] items-center gap-3 rounded-md border-[0.5px] border-white bg-onbrand-charcoal px-4 py-3 text-left text-white transition hover:bg-white hover:text-onbrand-charcoal ${className}`}
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
    <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
  </svg>
);

const CodexIcon = ({ className }: Readonly<{ className?: string }>) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z"
    />
  </svg>
);

const CursorIcon = ({ className }: Readonly<{ className?: string }>) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z" />
  </svg>
);

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
