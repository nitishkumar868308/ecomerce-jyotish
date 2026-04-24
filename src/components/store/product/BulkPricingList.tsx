"use client";

import { cn } from "@/lib/utils";

interface BulkTier {
  qty: number;
  unitPrice: number;
}

interface BulkPricingListProps {
  tiers: BulkTier[];
  currencySymbol: string;
  activeQty: number;
}

export function BulkPricingList({
  tiers,
  currencySymbol,
  activeQty,
}: BulkPricingListProps) {
  if (!tiers || tiers.length === 0) return null;
  const sorted = [...tiers].sort((a, b) => a.qty - b.qty);
  let activeIdx = -1;
  for (let i = 0; i < sorted.length; i++) {
    if (activeQty >= sorted[i].qty) activeIdx = i;
  }

  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Bulk pricing
      </p>
      <ul className="space-y-1">
        {sorted.map((t, i) => {
          const isActive = i === activeIdx;
          return (
            <li
              key={`${t.qty}-${t.unitPrice}`}
              className={cn(
                "flex items-center justify-between rounded-md px-2 py-1 text-sm",
                isActive
                  ? "bg-[var(--accent-primary)]/10 font-semibold text-[var(--accent-primary)]"
                  : "text-[var(--text-secondary)]",
              )}
            >
              <span>
                Buy {t.qty} get {currencySymbol}
                {t.unitPrice.toLocaleString()}
              </span>
              {isActive && (
                <span className="rounded-full bg-[var(--accent-primary)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
                  Applied
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
