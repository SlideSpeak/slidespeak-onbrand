import type { CSSProperties } from "react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => (
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
        "--normal-bg": "var(--onbrand-surface)",
        "--normal-text": "var(--onbrand-ink)",
        "--normal-border": "color-mix(in oklab, var(--onbrand-ink) 12%, transparent)",
        "--border-radius": "0.375rem",
      } as CSSProperties
    }
    {...props}
  />
);

export { Toaster };
