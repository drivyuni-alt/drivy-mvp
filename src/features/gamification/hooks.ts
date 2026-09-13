import { useQuery } from "@tanstack/react-query";

import { fetchAchievementsWithStatus } from "./api";

export function useAchievements(userId: string | undefined) {
  return useQuery({
    queryKey: ["achievements", userId],
    queryFn: () => fetchAchievementsWithStatus(userId!),
    enabled: Boolean(userId),
  });
}
