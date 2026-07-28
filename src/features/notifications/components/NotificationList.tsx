"use client";

import Link from "next/link";

import { Badge, Button, Card, CardContent, Skeleton } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "../hooks";

const ICONS: Record<Tables<"notifications">["type"], string> = {
  booking_requested: "🙋",
  booking_accepted: "✅",
  booking_rejected: "❌",
  booking_cancelled: "🚫",
  trip_starting_soon: "🚗",
  passenger_picked_up: "📍",
  new_message: "💬",
  new_rating: "⭐",
  achievement_unlocked: "🏅",
  sos_alert: "🆘",
};

function notificationHref(notification: Tables<"notifications">): string | null {
  const data = notification.data as { trip_id?: string };
  return data.trip_id ? `/trips/${data.trip_id}` : null;
}

export function NotificationList({ userId }: { userId: string }) {
  const notifications = useNotifications(userId);
  const markRead = useMarkNotificationRead(userId);
  const markAllRead = useMarkAllNotificationsRead(userId);

  if (notifications.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!notifications.data || notifications.data.length === 0) {
    return (
      <Card>
        <CardContent className="text-sm text-neutral-500 dark:text-neutral-400">
          No tienes notificaciones todavía.
        </CardContent>
      </Card>
    );
  }

  const hasUnread = notifications.data.some((notification) => !notification.read_at);

  return (
    <div className="flex flex-col gap-3">
      {hasUnread && (
        <Button size="sm" variant="ghost" className="self-end" onClick={() => markAllRead.mutate()}>
          Marcar todas como leídas
        </Button>
      )}

      {notifications.data.map((notification) => {
        const href = notificationHref(notification);
        const content = (
          <Card
            className={cn(
              "flex items-start gap-3 p-4",
              !notification.read_at && "border-brand/40 bg-brand/5"
            )}
          >
            <span className="text-xl" aria-hidden>
              {ICONS[notification.type]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900 dark:text-white">
                {notification.title}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{notification.body}</p>
              <p className="mt-1 text-xs text-neutral-400">{formatDateTime(notification.created_at)}</p>
            </div>
            {!notification.read_at && <Badge variant="brand">Nuevo</Badge>}
          </Card>
        );

        return (
          <div key={notification.id} onClick={() => !notification.read_at && markRead.mutate(notification.id)}>
            {href ? <Link href={href}>{content}</Link> : content}
          </div>
        );
      })}
    </div>
  );
}
