"use client";

import { Check } from "lucide-react";
import type { Offer } from "@/types/product";
import { usePrice } from "@/hooks/usePrice";

interface OfferListProps {
  offers?: Offer[];
  bulkPrice?: string;
  minQuantity?: string;
  claimedOfferIds?: number[];
  bulkApplied?: boolean;
}

export function OfferList({
  offers,
  bulkPrice,
  minQuantity,
  claimedOfferIds = [],
  bulkApplied = false,
}: OfferListProps) {
  const { format } = usePrice();

  const activeOffers = offers?.filter((o) => o.active && !o.deleted) || [];
  const hasBulk = !!(bulkPrice && minQuantity);

  if (activeOffers.length === 0 && !hasBulk) return null;

  return (
    <div className="mt-4 space-y-2">
      {activeOffers.map((offer) => {
        const isClaimed = claimedOfferIds.includes(offer.id);
        return (
          <div
            key={offer.id}
            className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950/20"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                {offer.name}
                {offer.description && (
                  <span className="ml-1 font-normal text-green-600 dark:text-green-500">
                    - {offer.description}
                  </span>
                )}
              </p>
              {isClaimed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-200 px-2 py-0.5 text-[10px] font-semibold text-green-800 dark:bg-green-800 dark:text-green-300">
                  <Check className="h-3 w-3" /> Claimed
                </span>
              )}
            </div>
          </div>
        );
      })}

      {hasBulk && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Buy {Number(minQuantity)}+ units at {format(Number(bulkPrice))} each
            </p>
            {bulkApplied && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-800 dark:text-blue-300">
                <Check className="h-3 w-3" /> Applied
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OfferList;
