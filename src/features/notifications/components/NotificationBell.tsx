"use client";

import Link from "next/link";

import { useUnreadNotificationsCount } from "../hooks";
import { useRealtimeNotifications } from "../realtime";

export function NotificationBell({ userId }: { userId: string }) {
  const unreadCount = useUnreadNotificationsCount(userId);
  useRealtimeNotifications(userId);

  return (
    <Link
      href="/notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      aria-label="Notificaciones"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
        />
      </svg>
      {Boolean(unreadCount.data) && unreadCount.data! > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
          {unreadCount.data}
        </span>
      )}
    </Link>
  );
}
