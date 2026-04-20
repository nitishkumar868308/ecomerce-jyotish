"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface VariationRowCardProps {
  id: string;
  children: ReactNode;
}

/**
 * Wraps one variation row with dnd-kit sortable plumbing. The drag handle is
 * the only element that starts a drag; clicking anywhere else bubbles normally
 * so the whole-row expand behaviour keeps working.
 */
export function VariationRowCard({ id, children }: VariationRowCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]",
        isDragging && "ring-2 ring-[var(--accent-primary)]",
      )}
    >
      <div className="flex items-start">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="flex h-11 w-8 shrink-0 cursor-grab items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
