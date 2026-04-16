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

export function useAdminOrder(id: string | number) {
  return useQuery({
    queryKey: ["admin", "order", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Order>>(ENDPOINTS.ORDERS.SINGLE(id));
      return data.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useAdminUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      ...payload
    }: { id: number; status?: OrderStatus; trackingNumber?: string; trackingUrl?: string; notes?: string }) => {
      const { data } = await api.put(ENDPOINTS.ORDERS.SINGLE(id), { status, ...payload });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "order"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update order");
    },
  });
}
