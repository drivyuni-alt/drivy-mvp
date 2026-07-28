import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";

import { getNewlyUnlockedAchievements } from "./evaluate-achievements";
import { computeLevel } from "./leveling";

/**
 * Re-evaluates one user's achievements against their current stats and unlocks/notifies
 * for anything newly qualified. Called after trip completion (see
 * features/route-assistant/actions.ts); server-only because it writes to
 * `user_achievements`/`notifications`/`user_statistics`, none of which grant
 * `authenticated` write access — see docs/02-decisiones-fase-1.md.
 */
export async function unlockAchievementsForUser(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<void> {
  const [{ data: achievements }, { data: unlocked }, { data: stats }, { data: userRow }] =
    await Promise.all([
      admin.from("achievements").select("*"),
      admin.from("user_achievements").select("achievement_id").eq("user_id", userId),
      admin.from("user_statistics").select("*").eq("user_id", userId).single(),
      admin.from("users").select("*").eq("id", userId).single(),
    ]);
  if (!achievements || !stats || !userRow) return;

  const unlockedIds = new Set((unlocked ?? []).map((row) => row.achievement_id));
  const newlyUnlocked = getNewlyUnlockedAchievements(achievements, unlockedIds, {
    totalTrips: stats.trips_as_driver + stats.trips_as_passenger,
    co2SavedKg: stats.co2_saved_kg,
    punctualityScore: stats.punctuality_score,
    ratingAvg: userRow.rating_avg,
  });
  if (newlyUnlocked.length === 0) return;

  const bonusPoints = newlyUnlocked.reduce((sum, achievement) => sum + achievement.points, 0);
  const newTotalPoints = stats.total_points + bonusPoints;

  await Promise.all([
    admin
      .from("user_achievements")
      .insert(newlyUnlocked.map((achievement) => ({ user_id: userId, achievement_id: achievement.id }))),
    admin
      .from("user_statistics")
      .update({ total_points: newTotalPoints, level: computeLevel(newTotalPoints) })
      .eq("user_id", userId),
    ...newlyUnlocked.map((achievement) =>
      admin.from("notifications").insert({
        user_id: userId,
        type: "achievement_unlocked" as const,
        title: "¡Nuevo logro desbloqueado!",
        body: `Has conseguido "${achievement.name}".`,
        data: { achievement_id: achievement.id },
      })
    ),
  ]);
}
