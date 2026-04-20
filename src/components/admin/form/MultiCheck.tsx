"use client";

import { cn } from "@/lib/utils";

export interface MultiCheckOption<V extends string | number = string | number> {
  value: V;
  label: string;
}

interface MultiCheckProps<V extends string | number> {
  label: string;
  options: MultiCheckOption<V>[];
  value: V[];
  onChange: (next: V[]) => void;
  /** Short note shown under the label (e.g., "Backend support pending"). */
  hint?: string;
  disabled?: boolean;
  /** Rendered when options are still loading. */
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function MultiCheck<V extends string | number>({
  label,
  options,
  value,
  onChange,
  hint,
  disabled,
  loading,
  emptyMessage = "No options",
  className,
}: MultiCheckProps<V>) {
  const toggle = (v: V) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
        {hint && <span className="text-xs text-[var(--text-muted)]">{hint}</span>}
      </div>

      <div
        className={cn(
          "rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3",
          disabled && "opacity-60",
        )}
      >
        {loading ? (
          <p className="text-xs text-[var(--text-muted)]">Loading...</p>
        ) : options.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">{emptyMessage}</p>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {options.map((opt) => {
              const checked = value.includes(opt.value);
              return (
                <label
                  key={String(opt.value)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 text-sm text-[var(--text-primary)]",
                    disabled && "cursor-not-allowed",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(opt.value)}
                    disabled={disabled}
                    className="h-4 w-4 rounded border-[var(--border-primary)] accent-[var(--accent-primary)]"
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
