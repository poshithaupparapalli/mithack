"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/** Two-or-three-way toggle with a sliding indicator. Used for Canon vs Individual. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-1 rounded-2xl border border-line bg-surface-sunk p-1", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active ? "text-ink" : "text-ink-faint hover:text-ink-soft",
            )}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-xl bg-surface shadow-[0_1px_3px_rgba(28,25,23,0.10)]"
              />
            ) : null}
            <span className="relative flex items-center justify-center gap-1.5">
              {option.label}
              {option.count !== undefined ? (
                <span className={cn("text-xs", active ? "text-ink-faint" : "text-ink-faint/70")}>
                  {option.count}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
