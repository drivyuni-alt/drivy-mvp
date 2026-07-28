"use client";

import { cn } from "@/lib/utils";

export function StarRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-ink-900 dark:text-neutral-200">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${star} estrellas`}
            className={cn(
              "text-2xl transition-transform hover:scale-110",
              star <= value ? "text-brand" : "text-neutral-300 dark:text-neutral-700"
            )}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
