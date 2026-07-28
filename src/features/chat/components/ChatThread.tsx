"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import { Skeleton } from "@/components/ui";

import { useChat, useMarkChatRead, useMessages } from "../hooks";
import { useRealtimeMessages, useTypingIndicator } from "../realtime";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";

export function ChatThread({ chatId, currentUserId }: { chatId: string; currentUserId: string }) {
  const chat = useChat(chatId);
  const messages = useMessages(chatId);
  const markRead = useMarkChatRead(chatId, currentUserId);
  const { isOtherTyping, notifyTyping } = useTypingIndicator(chatId, currentUserId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useRealtimeMessages(chatId);

  useEffect(() => {
    markRead.mutate();
    // Only re-run when new messages arrive, not on every markRead identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.data?.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data?.length]);

  if (chat.isLoading || messages.isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!chat.data) {
    return <p className="p-4 text-sm text-neutral-500 dark:text-neutral-400">Chat no encontrado.</p>;
  }

  const otherUser = chat.data.chat.driver_id === currentUserId ? chat.data.passenger : chat.data.driver;

  return (
    <div className="flex h-[75vh] flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 sm:h-[80vh]">
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-surface-dark">
        <Link
          href={`/trips/${chat.data.chat.trip_id}`}
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Ver viaje"
        >
          ←
        </Link>
        <div className="h-9 w-9 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          {otherUser.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element -- remote Supabase Storage URL
            <img src={otherUser.avatar_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900 dark:text-white">
            {otherUser.first_name} {otherUser.last_name}
          </p>
          {isOtherTyping && (
            <p className="text-xs text-brand-600 dark:text-brand">escribiendo…</p>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.data && messages.data.length > 0 ? (
          messages.data.map((message) => (
            <MessageBubble key={message.id} message={message} isOwn={message.sender_id === currentUserId} />
          ))
        ) : (
          <p className="text-center text-sm text-neutral-400">Aún no hay mensajes.</p>
        )}
        <div ref={bottomRef} />
      </div>

      <MessageComposer chatId={chatId} senderId={currentUserId} onTyping={notifyTyping} />
    </div>
  );
}
