"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

// Accessible toggle. Used inline in admin tables to flip an entity's `active`
// flag without opening its edit modal.
export function Switch({
  checked,
  onChange,
  disabled,
  loading,
  size = "md",
  label,
  className,
}: SwitchProps) {
  const sizes =
    size === "sm"
      ? { track: "h-4 w-7", knob: "h-3 w-3", knobOn: "translate-x-3" }
      : { track: "h-5 w-9", knob: "h-4 w-4", knobOn: "translate-x-4" };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || loading) return;
    onChange(!checked);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 focus:ring-offset-1",
        sizes.track,
        checked ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-tertiary)]",
        (disabled || loading) && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex translate-x-0.5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200",
          sizes.knob,
          checked && sizes.knobOn,
        )}
      >
        {loading && <Loader2 className="h-2.5 w-2.5 animate-spin text-[var(--accent-primary)]" />}
      </span>
    </button>
  );
}
