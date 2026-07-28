import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-ink-900 dark:text-neutral-200"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            className={cn(
              "h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm text-ink-900",
              "placeholder:text-neutral-400 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
              "dark:border-neutral-700 dark:bg-surface-dark-muted dark:text-white",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-danger focus:border-danger focus:ring-danger",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </span>
          )}
        </div>
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : hint ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
