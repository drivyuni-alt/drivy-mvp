import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

const TYPING_TIMEOUT_MS = 3000;

/**
 * Subscribes to new INSERTs on `messages` for this chat via Supabase Realtime and
 * invalidates the message/chat-list queries so TanStack Query refetches — simpler and
 * less bug-prone than manually splicing the new row into the cache, and cheap enough at
 * MVP chat volumes. Requires `messages` to be added to the `supabase_realtime`
 * publication (see supabase/migrations/0010_realtime_and_chat_storage.sql).
 */
export function useRealtimeMessages(chatId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
          queryClient.invalidateQueries({ queryKey: ["chats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, queryClient]);
}

/**
 * Ephemeral "is typing" indicator over a Realtime Broadcast channel — deliberately not
 * persisted to Postgres (nothing here is meaningful once the tab closes).
 */
export function useTypingIndicator(chatId: string, currentUserId: string) {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`typing:${chatId}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.userId === currentUserId) return;
        setIsOtherTyping(true);
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        clearTimerRef.current = setTimeout(() => setIsOtherTyping(false), TYPING_TIMEOUT_MS);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUserId]);

  function notifyTyping() {
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId },
    });
  }

  return { isOtherTyping, notifyTyping };
}
