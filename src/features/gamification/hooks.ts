import { useQuery } from "@tanstack/react-query";

import { fetchAchievementsWithStatus, fetchUniversityRanking } from "./api";

export function useAchievements(userId: string | undefined) {
  return useQuery({
    queryKey: ["achievements", userId],
    queryFn: () => fetchAchievementsWithStatus(userId!),
    enabled: Boolean(userId),
  });
}

export function useUniversityRanking() {
  return useQuery({
    queryKey: ["universityRanking"],
    queryFn: fetchUniversityRanking,
    staleTime: 5 * 60_000,
  });
}
