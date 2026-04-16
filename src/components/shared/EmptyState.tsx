"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className
      )}
    >
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-secondary)]">
          <Icon className="h-7 w-7 text-[var(--text-muted)]" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        {title}
      </h3>
      {description && (
        <p className="max-w-sm text-sm text-[var(--text-muted)]">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            "mt-2 rounded-md px-4 py-2 text-sm font-medium",
            "bg-[var(--accent-primary)] text-white",
            "hover:opacity-90 transition-opacity"
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
