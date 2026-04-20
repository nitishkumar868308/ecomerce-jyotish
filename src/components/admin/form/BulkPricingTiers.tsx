"use client";

import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export interface BulkTier {
  qty: number;
  unitPrice: number;
}

interface BulkPricingTiersProps {
  label?: string;
  hint?: string;
  value: BulkTier[];
  onChange: (next: BulkTier[]) => void;
  /** Fallback unit price shown as reference (e.g. the product's `price`). */
  basePrice?: string | number | null;
  disabled?: boolean;
  className?: string;
}

/**
 * Volume-pricing tier editor.
 *
 * Each row: qty threshold + unit price. When a user buys ≥ qty, they get
 * unitPrice per unit. Admins typically stack cheaper tiers at higher qty
 * (20 → ₹2, 50 → ₹1.5). Offer takes precedence BELOW the lowest tier's qty;
 * bulk takes over from there.
 */
export function BulkPricingTiers({
  label = "Bulk pricing tiers",
  hint,
  value,
  onChange,
  basePrice,
  disabled,
  className,
}: BulkPricingTiersProps) {
  const updateRow = (i: number, patch: Partial<BulkTier>) => {
    const next = value.map((row, idx) => (idx === i ? { ...row, ...patch } : row));
    onChange(next);
  };

  const addRow = () => {
    const maxQty = value.reduce((m, r) => Math.max(m, r.qty), 0);
    const suggestQty = maxQty > 0 ? maxQty + 10 : 10;
    const suggestPrice = basePrice ? Number(basePrice) : 0;
    onChange([...value, { qty: suggestQty, unitPrice: suggestPrice }]);
  };

  const removeRow = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  // Sort-aware validation: qtys should be ascending and prices should be
  // weakly decreasing (bulk = cheaper). Flag obvious mis-orderings inline.
  const sorted = [...value].sort((a, b) => a.qty - b.qty);
  const problems = new Map<number, string>();
  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    if (!row.qty || row.qty < 1) {
      problems.set(i, "Qty must be ≥ 1");
      continue;
    }
    if (row.unitPrice == null || Number.isNaN(row.unitPrice)) {
      problems.set(i, "Enter a unit price");
      continue;
    }
    const prev = sorted[i - 1];
    if (prev && row.unitPrice > prev.unitPrice) {
      problems.set(i, "Higher qty usually costs less per unit");
    }
    const dup = sorted.findIndex(
      (r, idx) => idx !== i && r.qty === row.qty,
    );
    if (dup !== -1) problems.set(i, "Duplicate qty threshold");
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
        {hint && <span className="text-xs text-[var(--text-muted)]">{hint}</span>}
      </div>

      {value.length === 0 ? (
        <div className="flex items-center justify-between rounded-lg border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-3 text-xs text-[var(--text-muted)]">
          <span>No bulk tiers set. Normal price applies at any quantity.</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addRow}
            disabled={disabled}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Add tier
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-lg border border-[var(--border-primary)]">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-px bg-[var(--border-primary)] text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <div className="bg-[var(--bg-secondary)] px-3 py-2">
                Qty ≥
              </div>
              <div className="bg-[var(--bg-secondary)] px-3 py-2">
                Unit price
              </div>
              <div className="bg-[var(--bg-secondary)] px-3 py-2" />
            </div>
            <div className="divide-y divide-[var(--border-primary)] bg-[var(--bg-card)]">
              {value.map((row, i) => {
                const problem = problems.get(i);
                return (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 px-2 py-2"
                  >
                    <input
                      type="number"
                      min={1}
                      value={row.qty}
                      onChange={(e) =>
                        updateRow(i, { qty: Number(e.target.value) || 0 })
                      }
                      disabled={disabled}
                      className="w-full rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.unitPrice}
                      onChange={(e) =>
                        updateRow(i, {
                          unitPrice: Number(e.target.value) || 0,
                        })
                      }
                      disabled={disabled}
                      className="w-full rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      disabled={disabled}
                      aria-label="Remove tier"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-danger)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {problem && (
                      <div className="col-span-3 -mt-0.5 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-3 w-3" />
                        {problem}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">
              {value.length} tier{value.length === 1 ? "" : "s"}
              {basePrice != null && ` · base ₹${basePrice}`}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addRow}
              disabled={disabled}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add tier
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
