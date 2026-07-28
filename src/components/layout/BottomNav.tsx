"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { NavIcon } from "./NavIcon";
import { NAV_ITEMS } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-neutral-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur",
        "dark:border-neutral-800 dark:bg-surface-dark/95 sm:hidden"
      )}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "text-ink-900 dark:text-white"
                : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            )}
          >
            <NavIcon
              icon={item.icon}
              className={cn("h-6 w-6", isActive && "text-brand-600 dark:text-brand")}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
