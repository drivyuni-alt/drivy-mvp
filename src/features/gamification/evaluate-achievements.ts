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
    return {
      type: criteria.type as AchievementCriteriaType,
      count: criteria.count,
      minTrips: typeof criteria.min_trips === "number" ? criteria.min_trips : 0,
    };
  }
  return null;
}

/**
 * Algunos criterios se miden sobre estadísticas que nacen con un valor "bueno" por defecto
 * y no sobre algo que el usuario haya demostrado. `user_statistics.punctuality_score`
 * arranca en 100 para cualquier cuenta recién creada, así que "Puntual estrella"
 * (puntualidad > 95) se desbloqueaba en el primerísimo viaje, sin un solo dato real de
 * puntualidad detrás. El `min_trips` del criterio es la condición de volumen mínimo que
 * evita premiar un valor por defecto: hasta que no hay suficientes viajes completados, el
 * logro no está en juego.
 */
function meetsCriteria(criteria: AchievementCriteria, context: AchievementContext): boolean {
  if (context.totalTrips < criteria.minTrips) return false;

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
