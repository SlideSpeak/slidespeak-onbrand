import { Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";
import type { ThemeMode } from "./theme";

const THEME_OPTIONS = [
  { icon: Sun01Icon, label: "Light", value: "light" },
  { icon: Moon02Icon, label: "Dark", value: "dark" },
] as const;

export const ThemeToggle = ({
  onThemeChange,
  theme,
}: Readonly<{
  onThemeChange: (theme: ThemeMode) => void;
  theme: ThemeMode;
}>) => (
  <div
    aria-label="Theme"
    className="inline-flex h-10 shrink-0 rounded-md border border-onbrand-charcoal/10 bg-onbrand-white p-0.5 shadow-[0_6px_18px_rgba(17,17,17,0.04)]"
  >
    {THEME_OPTIONS.map((option) => {
      const isSelected = option.value === theme;

      return (
        <button
          key={option.value}
          aria-pressed={isSelected}
          className={cn(
            "inline-flex h-8 min-w-8 cursor-pointer items-center justify-center gap-1.5 rounded-sm px-2 text-xs transition focus-visible:ring-2 focus-visible:ring-onbrand-blue-200 focus-visible:outline-none",
            isSelected
              ? "bg-onbrand-blue-50 text-onbrand-blue-600 ring-1 ring-onbrand-blue-200"
              : "text-onbrand-charcoal/62 hover:text-onbrand-blue-600",
          )}
          onClick={() => onThemeChange(option.value)}
          title={`${option.label} mode`}
          type="button"
        >
          <HugeiconsIcon
            aria-hidden="true"
            className="h-4 w-4"
            icon={option.icon}
            strokeWidth={2}
          />
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      );
    })}
  </div>
);
