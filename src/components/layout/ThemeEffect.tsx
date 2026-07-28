"use client";

import { useEffect } from "react";

import { useThemeStore } from "@/store/theme-store";

/**
 * Applies the persisted theme preference to <html class="dark">. A blocking inline
 * script in the root layout already sets the class before first paint to avoid a
 * flash of the wrong theme; this effect keeps it in sync afterwards (store changes,
 * OS-level dark-mode toggles while `theme === "system"`).
 */
export function ThemeEffect() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    const applyDark = (isDark: boolean) => root.classList.toggle("dark", isDark);

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      applyDark(media.matches);
      const listener = (event: MediaQueryListEvent) => applyDark(event.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }

    applyDark(theme === "dark");
  }, [theme]);

  return null;
}
