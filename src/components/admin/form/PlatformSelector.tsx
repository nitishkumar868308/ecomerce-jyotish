"use client";

import { Check, Store, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_OPTIONS } from "@/config/platforms";

interface PlatformSelectorProps {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  hint?: string;
  className?: string;
}

// Pill-style selector. At most two platforms today (Wizard Mall + QuickGo) so
// a dedicated visual treatment reads cleaner than a generic checkbox list.
export function PlatformSelector({
  value,
  onChange,
  label = "Platforms",
  hint,
  className,
}: PlatformSelectorProps) {
  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };

  const iconFor = (v: string) => {
    if (v === "quickgo") return <Zap className="h-4 w-4" />;
    return <Store className="h-4 w-4" />;
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
        {hint && <span className="text-xs text-[var(--text-muted)]">{hint}</span>}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {PLATFORM_OPTIONS.map((opt) => {
          const checked = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              aria-pressed={checked}
              className={cn(
                "group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150",
                checked
                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary-light,rgba(99,102,241,0.08))] shadow-sm"
                  : "border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)]",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                  checked
                    ? "bg-[var(--accent-primary)] text-white"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]",
                )}
              >
                {iconFor(opt.value)}
              </span>

              <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">
                {opt.label}
              </span>

              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  checked
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                    : "border-[var(--border-primary)] bg-transparent",
                )}
                aria-hidden
              >
                {checked && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
