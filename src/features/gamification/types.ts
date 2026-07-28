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
}

export interface AchievementWithStatus {
  achievement: Tables<"achievements">;
  unlockedAt: string | null;
}

export interface UniversityRankingEntry {
  university: Tables<"universities">;
  totalPoints: number;
  memberCount: number;
}
