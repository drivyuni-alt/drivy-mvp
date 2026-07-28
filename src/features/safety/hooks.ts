import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { blockUser, fetchBlockedUserIds, fetchBlockedUsers, submitReport, unblockUser } from "./api";
import { triggerSosAction } from "./actions";

export function useBlockedUsers(userId: string | undefined) {
  return useQuery({
    queryKey: ["blockedUsers", userId],
    queryFn: () => fetchBlockedUsers(userId!),
    enabled: Boolean(userId),
  });
}

export function useBlockedUserIds(userId: string | undefined) {
  return useQuery({
    queryKey: ["blockedUserIds", userId],
    queryFn: () => fetchBlockedUserIds(userId!),
    enabled: Boolean(userId),
  });
}

function invalidateBlockLists(queryClient: ReturnType<typeof useQueryClient>, userId: string) {
  queryClient.invalidateQueries({ queryKey: ["blockedUsers", userId] });
  queryClient.invalidateQueries({ queryKey: ["blockedUserIds", userId] });
}

export function useBlockUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockedId: string) => blockUser(userId, blockedId),
    onSuccess: () => invalidateBlockLists(queryClient, userId),
  });
}

export function useUnblockUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockedId: string) => unblockUser(userId, blockedId),
    onSuccess: () => invalidateBlockLists(queryClient, userId),
  });
}

export function useSubmitReport() {
  return useMutation({ mutationFn: submitReport });
}

export function useTriggerSos() {
  return useMutation({ mutationFn: triggerSosAction });
}
