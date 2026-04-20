"use client";

import { useMemo } from "react";
import { useOrders } from "@/services/orders";

export function useHasDeliveredProduct(productId: string | number | null | undefined) {
  const { data, isLoading } = useOrders();

  const hasDelivered = useMemo(() => {
    if (!productId || !data) return false;
    const target = String(productId);
    const orders = data.data ?? [];
    return orders.some((order) => {
      if (order.status !== "DELIVERED") return false;
      const items = order.items ?? [];
      return items.some((li) => String(li.productId ?? "") === target);
    });
  }, [data, productId]);

  return { hasDelivered, isLoading };
}
