"use client";

import { Check, Gift, Percent, Tag } from "lucide-react";
import type { Offer } from "@/types/product";
import { usePrice } from "@/hooks/usePrice";
import { calculateOffer } from "@/lib/offers";
import { cn } from "@/lib/utils";

interface OfferListProps {
  offers?: Offer[];
  bulkPrice?: string;
  minQuantity?: string;
  /** Current quantity in cart — used to decide which offers are "live". */
  activeQuantity?: number;
  claimedOfferIds?: number[];
  bulkApplied?: boolean;
}

/**
 * Offer banner block shown on the product detail page.
 *
 * Previously we rendered a plain green row per offer without explaining the
 * trigger. This version:
 *   1. Ranks live/unlocked offers above locked/"unlock at N" offers.
 *   2. Builds a concrete headline like "Buy 12-19 items, get 2 FREE".
 *   3. Highlights the single best active offer with a gradient + icon so it
 *      stands out in the page.
 */
export function OfferList({
  offers,
  bulkPrice,
  minQuantity,
  activeQuantity = 1,
  claimedOfferIds = [],
  bulkApplied = false,
}: OfferListProps) {
  const { format } = usePrice();

  const activeOffers = (offers ?? []).filter((o) => o.active && !o.deleted);
  const hasBulk = !!(bulkPrice && minQuantity && Number(bulkPrice) > 0);
  if (activeOffers.length === 0 && !hasBulk) return null;

  const rows = activeOffers
    .map((offer) => {
      const result = calculateOffer(0, offer, activeQuantity);
      const unlocked = result.hasOffer;
      return { offer, result, unlocked };
    })
    .sort((a, b) => Number(b.unlocked) - Number(a.unlocked));

  const bulkUnlocked =
    hasBulk && activeQuantity >= Number(minQuantity ?? 0);

  return (
    <section
      aria-label="Offers"
      className="mt-4 overflow-hidden rounded-2xl border border-[var(--accent-primary)]/25 bg-gradient-to-br from-[var(--accent-primary)]/5 via-transparent to-emerald-500/5"
    >
      <header className="flex items-center gap-2 border-b border-[var(--accent-primary)]/15 bg-[var(--accent-primary)]/5 px-4 py-2">
        <Tag className="h-4 w-4 text-[var(--accent-primary)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Available offers
        </h3>
      </header>

      <ul className="divide-y divide-[var(--border-primary)]">
        {rows.map(({ offer, result, unlocked }) => {
          const claimed = claimedOfferIds.includes(offer.id);
          return (
            <li
              key={offer.id}
              className={cn(
                "flex items-start gap-3 px-4 py-3 transition-colors",
                unlocked
                  ? "bg-green-50 dark:bg-green-950/15"
                  : "bg-[var(--bg-primary)]",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  unlocked
                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                    : "bg-[var(--bg-secondary)] text-[var(--text-muted)]",
                )}
              >
                {result.freeItems > 0 ? (
                  <Gift className="h-4 w-4" />
                ) : (
                  <Percent className="h-4 w-4" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    unlocked
                      ? "text-green-700 dark:text-green-400"
                      : "text-[var(--text-primary)]",
                  )}
                >
                  {offer.name}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {result.offerHeadline || offer.description || "Limited time"}
                </p>
                {!unlocked && result.offerHeadline && (
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                    Add more to unlock
                  </p>
                )}
              </div>

              {claimed && (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-200 px-2 py-0.5 text-[10px] font-semibold text-green-800 dark:bg-green-800 dark:text-green-300">
                  <Check className="h-3 w-3" /> Claimed
                </span>
              )}
              {!claimed && unlocked && (
                <span className="shrink-0 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                  Live
                </span>
              )}
            </li>
          );
        })}

        {hasBulk && (
          <li
            className={cn(
              "flex items-start gap-3 px-4 py-3",
              bulkUnlocked
                ? "bg-blue-50 dark:bg-blue-950/15"
                : "bg-[var(--bg-primary)]",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                bulkUnlocked
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                  : "bg-[var(--bg-secondary)] text-[var(--text-muted)]",
              )}
            >
              <Tag className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-semibold",
                  bulkUnlocked
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-[var(--text-primary)]",
                )}
              >
                Bulk deal
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Buy {Number(minQuantity)} or more — pay just{" "}
                <span className="font-semibold">
                  {format(Number(bulkPrice))}
                </span>{" "}
                each.
              </p>
            </div>
            {bulkApplied ? (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-800 dark:text-blue-300">
                <Check className="h-3 w-3" /> Applied
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                Bulk
              </span>
            )}
          </li>
        )}
      </ul>
    </section>
  );
}

export default OfferList;
