"use client";

import { useMemo } from "react";
import { useOrders } from "@/services/orders";

/**
 * Review eligibility check. Earlier version required `status === "DELIVERED"`
 * which made it impossible for a shopper to review a product they'd
 * already paid for while the admin still marked the order as PROCESSING
 * — and blocked testing end-to-end flows in any non-prod environment
 * where orders rarely progress all the way to DELIVERED.
 *
 * New rule: a paid order that still contains the product and hasn't
 * been cancelled / failed / refunded unlocks the review. Shopper's
 * money has left the account; they've earned the right to say
 * something about it without waiting on courier status.
 *
 * Hook name is kept (`useHasDeliveredProduct`) so existing callers
 * don't need to change — only the gate semantics have relaxed.
 */
export function useHasDeliveredProduct(productId: string | number | null | undefined) {
  const { data, isLoading } = useOrders();

  const hasDelivered = useMemo(() => {
    if (!productId || !data) return false;
    const target = String(productId);
    const orders = data.data ?? [];
    const BLOCKED_STATUSES = new Set([
      "CANCELLED",
      "FAILED",
      "REFUNDED",
      "RETURNED",
    ]);
    return orders.some((order) => {
      if (BLOCKED_STATUSES.has(String(order.status ?? ""))) return false;
      if (String(order.paymentStatus ?? "") !== "PAID") return false;
      const items = order.items ?? [];
      return items.some((li) => String(li.productId ?? "") === target);
    });
  }, [data, productId]);

  return { hasDelivered, isLoading };
}
