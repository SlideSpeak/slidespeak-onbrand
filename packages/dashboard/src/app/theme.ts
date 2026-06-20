import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "onbrand.dashboard.theme";

const THEME_MODES = ["light", "dark"] as const;

export const isThemeMode = (value: unknown): value is ThemeMode =>
  typeof value === "string" && THEME_MODES.includes(value as ThemeMode);

export const resolveInitialTheme = ({
  storedTheme,
  systemPrefersDark,
}: Readonly<{
  storedTheme: string | null;
  systemPrefersDark: boolean;
}>): ThemeMode => {
  if (isThemeMode(storedTheme)) return storedTheme;
  return systemPrefersDark ? "dark" : "light";
};

const systemPrefersDark = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const readStoredTheme = (): string | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
};

const persistTheme = (theme: ThemeMode): void => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The visual preference should still work when storage is unavailable.
  }
};

const applyTheme = (theme: ThemeMode, root: HTMLElement = document.documentElement): void => {
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
};

export const getInitialTheme = (): ThemeMode =>
  resolveInitialTheme({
    storedTheme: readStoredTheme(),
    systemPrefersDark: systemPrefersDark(),
  });

const getCurrentTheme = (): ThemeMode => {
  if (typeof document !== "undefined" && isThemeMode(document.documentElement.dataset.theme))
    return document.documentElement.dataset.theme;
  return getInitialTheme();
};

export const initializeTheme = (): ThemeMode => {
  const theme = getInitialTheme();
  applyTheme(theme);
  return theme;
};

export const useDashboardTheme = () => {
  const [theme, setThemeState] = useState<ThemeMode>(getCurrentTheme);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const nextTheme = getInitialTheme();
      applyTheme(nextTheme);
      setThemeState(nextTheme);
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    persistTheme(nextTheme);
    applyTheme(nextTheme);
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  return { setTheme, theme, toggleTheme } as const;
};
