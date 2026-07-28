import type { Tables } from "@/lib/supabase/types";

export interface ChatWithParticipants {
  chat: Tables<"chats">;
  driver: Tables<"users">;
  passenger: Tables<"users">;
  lastMessage: Tables<"messages"> | null;
  unreadCount: number;
}

export interface QuickDelayTemplate {
  key: string;
  label: string;
}

export const QUICK_DELAY_TEMPLATES: QuickDelayTemplate[] = [
  { key: "delay_5", label: "Llego 5 min tarde" },
  { key: "delay_10", label: "Llego 10 min tarde" },
  { key: "on_my_way", label: "Voy de camino" },
  { key: "here", label: "Ya he llegado" },
];

export interface SendTextMessageInput {
  chatId: string;
  senderId: string;
  content: string;
}

export interface SendQuickDelayInput {
  chatId: string;
  senderId: string;
  templateKey: string;
}

export interface SendImageMessageInput {
  chatId: string;
  senderId: string;
  file: File;
}

export interface SendLocationMessageInput {
  chatId: string;
  senderId: string;
  lat: number;
  lng: number;
}
