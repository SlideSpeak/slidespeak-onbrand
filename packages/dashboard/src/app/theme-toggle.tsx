import { Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  <ToggleGroup
    onValueChange={(nextTheme) => {
      if (nextTheme === "light" || nextTheme === "dark") onThemeChange(nextTheme);
    }}
    type="single"
    value={theme}
  >
    {THEME_OPTIONS.map((option) => (
      <ToggleGroupItem
        key={option.value}
        aria-label={`${option.label} mode`}
        title={`${option.label} mode`}
        value={option.value}
      >
        <HugeiconsIcon
          aria-hidden="true"
          className="h-[18px] w-[18px]"
          color="currentColor"
          icon={option.icon}
          primaryColor="currentColor"
          secondaryColor="currentColor"
          strokeWidth={2}
        />
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
);
