import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

import type { AchievementWithStatus, UniversityRankingEntry } from "./types";

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

/**
 * Aggregated client-side (two flat queries + a reduce) rather than a SQL view — keeps
 * the same "no embedded selects, no Views entry in the hand-written Database type"
 * approach used everywhere else, see docs/07-decisiones-fase-5.md.
 */
export async function fetchUniversityRanking(): Promise<UniversityRankingEntry[]> {
  const supabase = createClient();

  const [{ data: universities, error: universitiesError }, { data: users, error: usersError }] =
    await Promise.all([
      supabase.from("universities").select("*"),
      supabase.from("users").select("*").not("university_id", "is", null),
    ]);
  if (universitiesError) throw universitiesError;
  if (usersError) throw usersError;

  const userIds = users.map((user) => user.id);
  const { data: stats, error: statsError } =
    userIds.length > 0
      ? await supabase.from("user_statistics").select("*").in("user_id", userIds)
      : { data: [] as Tables<"user_statistics">[], error: null };
  if (statsError) throw statsError;

  const statsByUserId = new Map(stats.map((row) => [row.user_id, row]));
  const totals = new Map<string, { totalPoints: number; memberCount: number }>();

  for (const user of users) {
    if (!user.university_id) continue;
    const entry = totals.get(user.university_id) ?? { totalPoints: 0, memberCount: 0 };
    entry.totalPoints += statsByUserId.get(user.id)?.total_points ?? 0;
    entry.memberCount += 1;
    totals.set(user.university_id, entry);
  }

  return universities
    .map((university) => {
      const entry = totals.get(university.id) ?? { totalPoints: 0, memberCount: 0 };
      return { university, totalPoints: entry.totalPoints, memberCount: entry.memberCount };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);
}
