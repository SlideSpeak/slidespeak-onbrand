import type { CSSProperties } from "react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

type OnbrandToasterVariant = "light" | "dark";

type OnbrandToasterProps = ToasterProps & { variant?: OnbrandToasterVariant };

const TOASTER_COLORS: Record<
  OnbrandToasterVariant,
  { background: string; text: string; border: string }
> = {
  light: {
    background: "var(--onbrand-surface)",
    text: "var(--onbrand-ink)",
    border: "color-mix(in oklab, var(--onbrand-ink) 12%, transparent)",
  },
  dark: { background: "#ffffff", text: "#111111", border: "#ffffff" },
};

const Toaster = ({ variant = "light", ...props }: OnbrandToasterProps) => {
  const colors = TOASTER_COLORS[variant];

  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <HugeiconsIcon className="h-5 w-5" icon={CheckmarkCircle01Icon} strokeWidth={2} />,
      }}
      toastOptions={{
        classNames: {
          toast: "!min-h-16 !w-80 !text-base",
        },
      }}
      style={
        {
          "--normal-bg": colors.background,
          "--normal-text": colors.text,
          "--normal-border": colors.border,
          "--border-radius": "0.375rem",
        } as CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
