import { createClient } from "@/lib/supabase/client";

import type { AchievementWithStatus } from "./types";

export async function fetchAchievementsWithStatus(userId: string): Promise<AchievementWithStatus[]> {
  const supabase = createClient();

  const [{ data: achievements, error: achievementsError }, { data: unlocked, error: unlockedError }] =
    await Promise.all([
      supabase.from("achievements").select("*").order("points", { ascending: true }),
      supabase.from("user_achievements").select("*").eq("user_id", userId),
    ]);
  if (achievementsError) throw achievementsError;
  if (unlockedError) throw unlockedError;

  const unlockedAtByAchievementId = new Map(unlocked.map((row) => [row.achievement_id, row.unlocked_at]));

  return achievements.map((achievement) => ({
    achievement,
    unlockedAt: unlockedAtByAchievementId.get(achievement.id) ?? null,
  }));
}
