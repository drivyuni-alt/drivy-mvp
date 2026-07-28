"use client";

import { Card, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

import { useUniversityRanking } from "../hooks";

export function UniversityRankingList() {
  const ranking = useUniversityRanking();

  if (ranking.isLoading) return <Skeleton className="h-40 w-full" />;
  if (!ranking.data || ranking.data.length === 0) return null;

  return (
    <Card className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
      {ranking.data.map((entry, index) => (
        <div key={entry.university.id} className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                index === 0
                  ? "bg-brand text-ink-900"
                  : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
              )}
            >
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-white">
                {entry.university.name}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {entry.memberCount} miembro{entry.memberCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <span className="text-sm font-semibold text-ink-900 dark:text-white">
            {entry.totalPoints} pts
          </span>
        </div>
      ))}
    </Card>
  );
}
