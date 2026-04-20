"use client";

import React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrice } from "@/hooks/usePrice";
import type { ConsultantDuration } from "@/types/consultant";

interface DurationSelectorProps {
  durations: ConsultantDuration[];
  selectedId?: number;
  onSelect: (id: number) => void;
  className?: string;
}

export function DurationSelector({
  durations,
  selectedId,
  onSelect,
  className,
}: DurationSelectorProps) {
  const { format } = usePrice();

  if (durations.length === 0) {
    return null;
  }

  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
      {durations.map((duration) => {
        const isSelected = duration.id === selectedId;

        return (
          <button
            key={duration.id}
            type="button"
            onClick={() => onSelect(duration.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all duration-200 sm:p-4",
              isSelected
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary-light)]/30 shadow-sm"
                : "border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-focus)]"
            )}
          >
            <Clock
              className={cn(
                "h-5 w-5",
                isSelected
                  ? "text-[var(--accent-primary)]"
                  : "text-[var(--text-secondary)]"
              )}
            />
            <span
              className={cn(
                "text-sm font-bold",
                isSelected
                  ? "text-[var(--accent-primary)]"
                  : "text-[var(--text-primary)]"
              )}
            >
              {duration.label || `${duration.minutes} min`}
            </span>
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {format(duration.price)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default DurationSelector;
