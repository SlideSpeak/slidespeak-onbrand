import { describe, expect, it } from "vitest";

import { isThemeMode, resolveInitialTheme } from "./theme";

describe("theme preference", () => {
  it("uses a stored light preference over the system default", () => {
    expect(resolveInitialTheme({ storedTheme: "light", systemPrefersDark: true })).toBe("light");
  });

  it("uses a stored dark preference over the system default", () => {
    expect(resolveInitialTheme({ storedTheme: "dark", systemPrefersDark: false })).toBe("dark");
  });

  it("defaults to light when no valid mode has been stored", () => {
    expect(resolveInitialTheme({ storedTheme: null, systemPrefersDark: true })).toBe("light");
    expect(resolveInitialTheme({ storedTheme: null, systemPrefersDark: false })).toBe("light");
    expect(resolveInitialTheme({ storedTheme: "system", systemPrefersDark: true })).toBe("light");
    expect(resolveInitialTheme({ storedTheme: "system", systemPrefersDark: false })).toBe("light");
  });

  it("accepts only supported theme modes", () => {
    expect(isThemeMode("light")).toBe(true);
    expect(isThemeMode("dark")).toBe(true);
    expect(isThemeMode("system")).toBe(false);
    expect(isThemeMode(null)).toBe(false);
  });
});
