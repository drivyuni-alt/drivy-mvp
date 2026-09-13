import type { Tables } from "@/lib/supabase/types";

export interface AchievementContext {
  totalTrips: number;
  co2SavedKg: number;
  punctualityScore: number;
  ratingAvg: number;
}

export type AchievementCriteriaType =
  | "trips_completed"
  | "co2_saved_kg"
  | "punctuality_score"
  | "rating_avg";

export interface AchievementCriteria {
  type: AchievementCriteriaType;
  count: number;
  /**
   * Viajes completados que hacen falta para que el logro pueda desbloquearse, además de su
   * criterio propio. Sale del campo opcional `min_trips` del `jsonb` de la tabla
   * `achievements`; 0 si no lo lleva. Ver el porqué en evaluate-achievements.ts.
   */
  minTrips: number;
}

export interface AchievementWithStatus {
  achievement: Tables<"achievements">;
  unlockedAt: string | null;
}
