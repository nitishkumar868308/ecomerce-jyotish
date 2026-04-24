import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Order, OrderStatus } from "@/types/order";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/api";
import toast from "react-hot-toast";

export function useAdminOrders(params?: PaginationParams & { status?: OrderStatus }) {
  return useQuery({
    queryKey: ["admin", "orders", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Order>>(ENDPOINTS.ORDERS.LIST, {
        params,
      });
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminOrder(id: string | number | undefined) {
  return useQuery({
    queryKey: ["admin", "order", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Order>>(
        ENDPOINTS.ORDERS.SINGLE(id as string | number),
      );
      return data.data;
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useAdminUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: number;
      status?: OrderStatus;
      paymentStatus?: string;
      trackingLink?: string;
      invoiceNumber?: string;
      locationCode?: string;
    }) => {
      // Backend update takes `id` in the body (PUT /orders), not in the
      // URL. The old `api.put(ORDERS.SINGLE(id), body)` was hitting a
      // non-existent /orders/:id route.
      const { data } = await api.put(ENDPOINTS.ORDERS.LIST, { id, ...payload });
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "order", variables.id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", variables.id] });
      toast.success("Order updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update order");
    },
  });
}

/**
 * Admin-created order adjustment (e.g., additional shipping, manual
 * debit). Shows up on the user's order detail modal and — once wired to
 * email — gets sent to the shopper with a PayU link to complete the
 * extra payment.
 */
export function useCreateOrderAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      orderId: number;
      adjustmentType:
        | "SHIPPING"
        | "NETWORK_FEE"
        | "ITEM_ADD"
        | "ITEM_REMOVE"
        | "DISCOUNT"
        | "PENALTY"
        | "TAX"
        | "MANUAL"
        | "ITEM_SHIPPING";
      impact: "DEBIT" | "CREDIT";
      amount: number;
      reason?: string;
      isManual?: boolean;
      manualType?: string;
    }) => {
      const { data } = await api.post(
        ENDPOINTS.PAYMENTS.ADJUSTMENTS,
        payload,
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["admin", "order", variables.orderId] });
      qc.invalidateQueries({ queryKey: ["order", variables.orderId] });
      toast.success("Payment request saved");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create adjustment",
      );
    },
  });
}
