import type { Tables } from "@/lib/supabase/types";

import type { AchievementContext, AchievementCriteria, AchievementCriteriaType } from "./types";

const CRITERIA_TYPES: AchievementCriteriaType[] = [
  "trips_completed",
  "co2_saved_kg",
  "punctuality_score",
  "rating_avg",
];

function parseCriteria(criteria: Tables<"achievements">["criteria"]): AchievementCriteria | null {
  if (
    criteria &&
    typeof criteria === "object" &&
    !Array.isArray(criteria) &&
    typeof criteria.type === "string" &&
    typeof criteria.count === "number" &&
    CRITERIA_TYPES.includes(criteria.type as AchievementCriteriaType)
  ) {
    return { type: criteria.type as AchievementCriteriaType, count: criteria.count };
  }
  return null;
}

function meetsCriteria(criteria: AchievementCriteria, context: AchievementContext): boolean {
  switch (criteria.type) {
    case "trips_completed":
      return context.totalTrips >= criteria.count;
    case "co2_saved_kg":
      return context.co2SavedKg >= criteria.count;
    case "punctuality_score":
      return context.punctualityScore >= criteria.count;
    case "rating_avg":
      return context.ratingAvg >= criteria.count;
  }
}

/** Pure function: given the catalog, what's already unlocked, and current stats, what newly qualifies. */
export function getNewlyUnlockedAchievements(
  achievements: Tables<"achievements">[],
  alreadyUnlockedIds: ReadonlySet<string>,
  context: AchievementContext
): Tables<"achievements">[] {
  return achievements.filter((achievement) => {
    if (alreadyUnlockedIds.has(achievement.id)) return false;
    const criteria = parseCriteria(achievement.criteria);
    return criteria !== null && meetsCriteria(criteria, context);
  });
}
