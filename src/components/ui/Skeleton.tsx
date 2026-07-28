import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-lg bg-[linear-gradient(90deg,theme(colors.neutral.200)_25%,theme(colors.neutral.100)_37%,theme(colors.neutral.200)_63%)] bg-[length:400%_100%]",
        "dark:bg-[linear-gradient(90deg,theme(colors.neutral.800)_25%,theme(colors.neutral.700)_37%,theme(colors.neutral.800)_63%)]",
        className
      )}
      {...props}
    />
  );
}
