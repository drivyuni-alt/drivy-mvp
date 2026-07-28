import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert } from "@/lib/supabase/types";

import type { SubmitReportInput } from "./types";

export async function submitReport(input: SubmitReportInput): Promise<void> {
  const supabase = createClient();
  const payload: TablesInsert<"reports"> = {
    reporter_id: input.reporterId,
    reported_user_id: input.reportedUserId,
    trip_id: input.tripId,
    reason: input.reason,
    details: input.details || null,
  };
  const { error } = await supabase.from("reports").insert(payload);
  if (error) throw error;
}

export async function fetchBlockedUsers(blockerId: string): Promise<Tables<"users">[]> {
  const supabase = createClient();
  const { data: blocks, error } = await supabase
    .from("blocked_users")
    .select("*")
    .eq("blocker_id", blockerId);
  if (error) throw error;
  if (blocks.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("*")
    .in("id", blocks.map((block) => block.blocked_id));
  if (usersError) throw usersError;
  return users;
}

export async function fetchBlockedUserIds(blockerId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blocked_users")
    .select("blocked_id")
    .eq("blocker_id", blockerId);
  if (error) throw error;
  return new Set(data.map((row) => row.blocked_id));
}

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("blocked_users").insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) throw error;
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) throw error;
}
