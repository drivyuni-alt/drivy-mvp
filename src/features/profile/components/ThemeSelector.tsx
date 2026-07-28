"use client";

import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";
import type { Theme } from "@/store/theme-store";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "system", label: "Sistema" },
];

export function ThemeSelector() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <div className="flex gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setTheme(option.value)}
          className={cn(
            "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
            theme === option.value
              ? "border-brand bg-brand/10 text-ink-900 dark:text-white"
              : "border-neutral-300 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
