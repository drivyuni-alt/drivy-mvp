"use client";

import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

import { useAchievements } from "../hooks";

export function AchievementGrid({ userId }: { userId: string }) {
  const achievements = useAchievements(userId);

  if (achievements.isLoading) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((key) => (
          <Skeleton key={key} className="aspect-square w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!achievements.data || achievements.data.length === 0) return null;

  return (
    <div className="grid grid-cols-4 gap-3">
      {achievements.data.map(({ achievement, unlockedAt }) => (
        <div
          key={achievement.id}
          title={`${achievement.name} — ${achievement.description}`}
          className={cn(
            "flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border p-2 text-center",
            unlockedAt
              ? "border-brand bg-brand/10"
              : "border-neutral-200 bg-neutral-50 opacity-40 dark:border-neutral-800 dark:bg-neutral-800/50"
          )}
        >
          <span className="text-2xl" aria-hidden>
            {achievement.icon}
          </span>
          <span className="text-[10px] font-medium leading-tight text-ink-900 dark:text-white">
            {achievement.name}
          </span>
        </div>
      ))}
    </div>
  );
}
