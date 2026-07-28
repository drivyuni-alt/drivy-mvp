"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import type { Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

import { NavIcon } from "./NavIcon";
import { NAV_ITEMS } from "./nav-items";

export function Navbar({ profile }: { profile: Tables<"users"> }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-surface-dark/95">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-bold text-ink-900">
            D
          </span>
          <span className="hidden text-lg font-semibold sm:inline">Drivy</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.filter((item) => item.href !== "/profile").map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-neutral-100 text-ink-900 dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-500 hover:text-ink-900 dark:hover:text-white"
                )}
              >
                <NavIcon icon={item.icon} className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <NotificationBell userId={profile.id} />
          <Link href="/profile" className="flex items-center gap-2">
            <span className="hidden text-sm font-medium text-ink-900 dark:text-white sm:inline">
              {profile.first_name}
            </span>
            <div className="h-9 w-9 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              {profile.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element -- remote Supabase Storage URL, avoids next/image domain config for MVP
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
