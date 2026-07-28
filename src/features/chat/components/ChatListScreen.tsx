"use client";

import Link from "next/link";

import { Badge, Card, CardContent, Skeleton } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

import { useChats } from "../hooks";

const MESSAGE_PREVIEW: Record<string, string> = {
  image: "📷 Foto",
  location: "📍 Ubicación compartida",
  quick_delay: "",
};

export function ChatListScreen({ userId }: { userId: string }) {
  const chats = useChats(userId);

  if (chats.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!chats.data || chats.data.length === 0) {
    return (
      <Card>
        <CardContent className="text-sm text-neutral-500 dark:text-neutral-400">
          Todavía no tienes conversaciones. Se crean automáticamente cuando aceptas o te
          aceptan una reserva.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {chats.data.map(({ chat, driver, passenger, lastMessage, unreadCount }) => {
        const otherUser = chat.driver_id === userId ? passenger : driver;
        const preview = lastMessage
          ? (MESSAGE_PREVIEW[lastMessage.type] ?? lastMessage.content ?? "")
          : "Empieza la conversación";

        return (
          <Link key={chat.id} href={`/chats/${chat.id}`}>
            <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-glow">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                {otherUser.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element -- remote Supabase Storage URL
                  <img src={otherUser.avatar_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                  {otherUser.first_name} {otherUser.last_name}
                </p>
                <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                  {preview}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {chat.last_message_at && (
                  <span className="text-xs text-neutral-400">
                    {formatDateTime(chat.last_message_at)}
                  </span>
                )}
                {unreadCount > 0 && <Badge variant="brand">{unreadCount}</Badge>}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
