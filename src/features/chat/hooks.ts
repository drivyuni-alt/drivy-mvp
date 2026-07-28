import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchChatByBookingId,
  fetchChatById,
  fetchChatsForUser,
  fetchMessages,
  markChatMessagesRead,
  sendImageMessage,
  sendLocationMessage,
  sendQuickDelayMessage,
  sendTextMessage,
} from "./api";

export function useChats(userId: string | undefined) {
  return useQuery({
    queryKey: ["chats", userId],
    queryFn: () => fetchChatsForUser(userId!),
    enabled: Boolean(userId),
  });
}

export function useChat(chatId: string) {
  return useQuery({
    queryKey: ["chats", "byId", chatId],
    queryFn: () => fetchChatById(chatId),
  });
}

export function useChatForBooking(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["chats", "byBooking", bookingId],
    queryFn: () => fetchChatByBookingId(bookingId!),
    enabled: Boolean(bookingId),
  });
}

export function useMessages(chatId: string) {
  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => fetchMessages(chatId),
  });
}

function useSendMutation<TInput extends { chatId: string }>(
  mutationFn: (input: TInput) => Promise<unknown>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}

export function useSendTextMessage() {
  return useSendMutation(sendTextMessage);
}

export function useSendQuickDelayMessage() {
  return useSendMutation(sendQuickDelayMessage);
}

export function useSendLocationMessage() {
  return useSendMutation(sendLocationMessage);
}

export function useSendImageMessage() {
  return useSendMutation(sendImageMessage);
}

export function useMarkChatRead(chatId: string, readerId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markChatMessagesRead(chatId, readerId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}
