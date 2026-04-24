"use client";

import { useMemo } from "react";
import type { CartItem } from "@/types/cart";
import type {
  CartMoneySummary,
  CartProductInfo,
  EnrichedCartItem,
  ProductGroupSummary,
} from "@/lib/cartMath";

interface UseCartSummaryResult {
  summary: CartMoneySummary;
  /**
   * Retained for signature compatibility with callers written against the
   * old client-side compute. Server is now the single source of truth so
   * this is always `false`.
   */
  isLoadingProducts: boolean;
  /** Retained for compatibility; always empty now. */
  products: Record<string, CartProductInfo | undefined>;
}

/**
 * Shapes the server-computed cart lines into the `CartMoneySummary` format
 * the existing CartDrawer / Checkout / ProductDetail components expect.
 *
 * All offer/bulk/currency math is done on the backend — this hook just
 * re-buckets the per-line response by `groupKey` and sums totals. No
 * product fetches, no retry logic, no duplicated math.
 */
export function useCartSummary(
  items: CartItem[] | undefined,
): UseCartSummaryResult {
  const summary = useMemo<CartMoneySummary>(() => {
    const rows = items ?? [];

    const enriched: EnrichedCartItem[] = rows.map((item) => {
      const originalUnitPrice = item.originalPrice;
      const effectiveUnitPrice = item.pricePerItem;
      const lineOriginal = originalUnitPrice * item.quantity;
      const lineFinal = item.lineTotal;
      const lineSavings = item.savedAmount;
      // Legacy aliases kept so the existing checkout / product-detail
      // components keep compiling against their earlier field names.
      return {
        ...item,
        paidQty: item.paidQty,
        freeQty: item.freeQty,
        originalUnitPrice,
        effectiveUnitPrice,
        lineOriginal,
        lineFinal,
        lineSavings,
        bulkApplied: item.bulkApplied,
        effectivePrice: effectiveUnitPrice,
        freeQtyInThisItem: item.freeQty,
        isFreeItem: item.freeQty > 0 && item.freeQty >= item.quantity,
        totalPrice: item.lineTotal,
        offerSummary:
          item.offerApplied && item.offerId && item.offerName
            ? {
                offerId: item.offerId,
                offerName: item.offerName,
                freeQty: item.freeQty,
                // Not all old consumers read these but keep them present
                // so the narrowed legacy shape is satisfied.
                totalQty: item.quantity,
                claimed: true,
                start: 0,
                end: 0,
              }
            : undefined,
      } as unknown as EnrichedCartItem;
    });

    const groupBuckets = new Map<string, EnrichedCartItem[]>();
    for (const row of enriched) {
      const arr = groupBuckets.get(row.groupKey);
      if (arr) arr.push(row);
      else groupBuckets.set(row.groupKey, [row]);
    }

    const groups: ProductGroupSummary[] = [...groupBuckets.entries()].map(
      ([groupKey, groupItems]) => {
        const first = groupItems[0];
        const totalQty = groupItems.reduce((s, i) => s + i.quantity, 0);
        const paidQty = groupItems.reduce((s, i) => s + i.paidQty, 0);
        const freeQty = groupItems.reduce((s, i) => s + i.freeQty, 0);
        const groupOriginal = groupItems.reduce(
          (s, i) => s + i.lineOriginal,
          0,
        );
        const groupFinal = groupItems.reduce((s, i) => s + i.lineFinal, 0);
        const groupSavings = groupItems.reduce(
          (s, i) => s + i.lineSavings,
          0,
        );

        const appliedOffer =
          first.offerApplied && first.offerId && first.offerName
            ? ({
                id: first.offerId,
                name: first.offerName,
                // Legacy shape — consumers only read id + name.
                discountType: "rangeBuyXGetY",
                discountValue: {},
                type: {},
                description: null,
                active: true,
                deleted: 0,
                createdAt: "",
                updatedAt: "",
              } as unknown as ProductGroupSummary["appliedOffer"])
            : undefined;

        return {
          groupKey,
          productId: first.productId,
          productName: first.productName,
          items: groupItems,
          totalQty,
          paidQty,
          freeQty,
          bulkApplied: first.bulkApplied,
          appliedOffer,
          groupOriginal,
          groupFinal,
          groupSavings,
        };
      },
    );

    const subtotalOriginal = enriched.reduce(
      (s, i) => s + i.lineOriginal,
      0,
    );
    const subtotalFinal = enriched.reduce((s, i) => s + i.lineFinal, 0);
    const totalSavings = subtotalOriginal - subtotalFinal;
    const totalQty = enriched.reduce((s, i) => s + i.quantity, 0);
    const totalFreeQty = enriched.reduce((s, i) => s + i.freeQty, 0);

    return {
      enriched,
      groups,
      subtotalOriginal,
      subtotalFinal,
      totalSavings,
      totalQty,
      totalFreeQty,
    };
  }, [items]);

  return { summary, isLoadingProducts: false, products: {} };
}
