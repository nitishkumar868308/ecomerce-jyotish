"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { ConsultantSlot } from "@/types/consultant";

interface SlotSelectorProps {
  slots: ConsultantSlot[];
  selectedId?: number;
  onSelect: (id: number) => void;
  className?: string;
}

export function SlotSelector({
  slots,
  selectedId,
  onSelect,
  className,
}: SlotSelectorProps) {
  if (slots.length === 0) {
    return (
      <p className={cn("text-sm text-[var(--text-secondary)]", className)}>
        No slots available for the selected date.
      </p>
    );
  }

  return (
    <div className={cn("grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5", className)}>
      {slots.map((slot) => {
        const isSelected = slot.id === selectedId;
        const isBooked = !slot.isAvailable;

        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => !isBooked && onSelect(slot.id)}
            disabled={isBooked}
            className={cn(
              "rounded-lg border px-3 py-2 text-center text-sm font-medium transition-all duration-200",
              isSelected
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white shadow-sm"
                : isBooked
                  ? "cursor-not-allowed border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] opacity-50 line-through"
                  : "border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary-light)]/30"
            )}
          >
            {slot.startTime}
          </button>
        );
      })}
    </div>
  );
}

export default SlotSelector;
