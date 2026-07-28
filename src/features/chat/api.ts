import { createClient } from "@/lib/supabase/client";
import { containsPhoneNumber, PHONE_NUMBER_BLOCKED_MESSAGE } from "@/lib/phone-detection";
import type { Tables, TablesInsert } from "@/lib/supabase/types";

import type {
  ChatWithParticipants,
  QuickDelayTemplate,
  SendImageMessageInput,
  SendLocationMessageInput,
  SendQuickDelayInput,
  SendTextMessageInput,
} from "./types";
import { QUICK_DELAY_TEMPLATES } from "./types";

export function findQuickDelayTemplate(key: string): QuickDelayTemplate | undefined {
  return QUICK_DELAY_TEMPLATES.find((template) => template.key === key);
}

export async function fetchChatsForUser(userId: string): Promise<ChatWithParticipants[]> {
  const supabase = createClient();

  const { data: chats, error: chatsError } = await supabase
    .from("chats")
    .select("*")
    .or(`driver_id.eq.${userId},passenger_id.eq.${userId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (chatsError) throw chatsError;
  if (chats.length === 0) return [];

  const chatIds = chats.map((chat) => chat.id);
  const userIds = [...new Set(chats.flatMap((chat) => [chat.driver_id, chat.passenger_id]))];

  const [{ data: users, error: usersError }, { data: messages, error: messagesError }] =
    await Promise.all([
      supabase.from("users").select("*").in("id", userIds),
      supabase
        .from("messages")
        .select("*")
        .in("chat_id", chatIds)
        .order("created_at", { ascending: false }),
    ]);
  if (usersError) throw usersError;
  if (messagesError) throw messagesError;

  const userById = new Map(users.map((user) => [user.id, user]));

  return chats.flatMap((chat) => {
    const driver = userById.get(chat.driver_id);
    const passenger = userById.get(chat.passenger_id);
    if (!driver || !passenger) return [];

    const chatMessages = messages.filter((message) => message.chat_id === chat.id);
    const lastMessage = chatMessages[0] ?? null;
    const unreadCount = chatMessages.filter(
      (message) => message.sender_id !== userId && !message.read_at
    ).length;

    return [{ chat, driver, passenger, lastMessage, unreadCount }];
  });
}

export async function fetchChatById(chatId: string): Promise<ChatWithParticipants | null> {
  const supabase = createClient();
  const { data: chat, error } = await supabase
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .maybeSingle();
  if (error) throw error;
  if (!chat) return null;

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("*")
    .in("id", [chat.driver_id, chat.passenger_id]);
  if (usersError) throw usersError;

  const driver = users.find((user) => user.id === chat.driver_id);
  const passenger = users.find((user) => user.id === chat.passenger_id);
  if (!driver || !passenger) return null;

  return { chat, driver, passenger, lastMessage: null, unreadCount: 0 };
}

export async function fetchChatByBookingId(bookingId: string): Promise<Tables<"chats"> | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMessages(chatId: string): Promise<Tables<"messages">[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function sendTextMessage(input: SendTextMessageInput): Promise<Tables<"messages">> {
  // Fails fast client-side (no round trip) for the common case; the database trigger
  // in 0014_reject_phone_numbers_in_chat.sql is what actually enforces this — see its
  // comment for why a client-only check isn't enough.
  if (containsPhoneNumber(input.content)) {
    throw new Error(PHONE_NUMBER_BLOCKED_MESSAGE);
  }

  return insertMessage({
    chat_id: input.chatId,
    sender_id: input.senderId,
    type: "text",
    content: input.content,
  });
}

export async function sendQuickDelayMessage(
  input: SendQuickDelayInput
): Promise<Tables<"messages">> {
  const template = findQuickDelayTemplate(input.templateKey);
  return insertMessage({
    chat_id: input.chatId,
    sender_id: input.senderId,
    type: "quick_delay",
    content: template?.label ?? input.templateKey,
  });
}

export async function sendLocationMessage(
  input: SendLocationMessageInput
): Promise<Tables<"messages">> {
  return insertMessage({
    chat_id: input.chatId,
    sender_id: input.senderId,
    type: "location",
    location_lat: input.lat,
    location_lng: input.lng,
  });
}

export async function sendImageMessage(input: SendImageMessageInput): Promise<Tables<"messages">> {
  const supabase = createClient();
  const extension = input.file.name.split(".").pop() ?? "jpg";
  const path = `${input.chatId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("chat-attachments")
    .upload(path, input.file, { contentType: input.file.type });
  if (uploadError) throw uploadError;

  const { data: signedUrl, error: signedUrlError } = await supabase.storage
    .from("chat-attachments")
    .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days
  if (signedUrlError) throw signedUrlError;

  return insertMessage({
    chat_id: input.chatId,
    sender_id: input.senderId,
    type: "image",
    image_url: signedUrl.signedUrl,
  });
}

async function insertMessage(payload: TablesInsert<"messages">): Promise<Tables<"messages">> {
  const supabase = createClient();
  const { data, error } = await supabase.from("messages").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function markChatMessagesRead(chatId: string, readerId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("chat_id", chatId)
    .neq("sender_id", readerId)
    .is("read_at", null);
  if (error) throw error;
}
