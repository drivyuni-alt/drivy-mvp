import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format";
import type { Tables } from "@/lib/supabase/types";

export function MessageBubble({
  message,
  isOwn,
}: {
  message: Tables<"messages">;
  isOwn: boolean;
}) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm",
          isOwn
            ? "rounded-br-sm bg-brand text-ink-900"
            : "rounded-bl-sm bg-neutral-100 text-ink-900 dark:bg-neutral-800 dark:text-white"
        )}
      >
        <MessageContent message={message} />
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-[10px]",
            isOwn ? "text-ink-900/60" : "text-neutral-400"
          )}
        >
          {formatTime(message.created_at)}
          {isOwn && <span aria-hidden>{message.read_at ? "✓✓" : "✓"}</span>}
        </div>
      </div>
    </div>
  );
}

function MessageContent({ message }: { message: Tables<"messages"> }) {
  switch (message.type) {
    case "image":
      return message.image_url ? (
        <a href={message.image_url} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element -- signed Supabase Storage URL */}
          <img
            src={message.image_url}
            alt="Imagen compartida"
            className="max-h-56 rounded-xl object-cover"
          />
        </a>
      ) : null;
    case "location":
      return message.location_lat != null && message.location_lng != null ? (
        <a
          href={`https://www.google.com/maps?q=${message.location_lat},${message.location_lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 underline"
        >
          <span aria-hidden>📍</span> Ver ubicación en el mapa
        </a>
      ) : null;
    case "quick_delay":
      return (
        <span className="flex items-center gap-1.5">
          <span aria-hidden>⏱️</span> {message.content}
        </span>
      );
    case "text":
    default:
      return <span className="whitespace-pre-wrap">{message.content}</span>;
  }
}
