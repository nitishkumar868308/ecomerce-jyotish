import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Order, CreateOrderPayload } from "@/types/order";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/api";
import toast from "react-hot-toast";

export function useOrders(params?: PaginationParams) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Order>>(ENDPOINTS.ORDERS.LIST, {
        params,
      });
      return data;
    },
  });
}

export function useOrder(id: string | number) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Order>>(ENDPOINTS.ORDERS.SINGLE(id));
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      const { data } = await api.post(ENDPOINTS.ORDERS.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Order placed!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to place order");
    },
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Order> & { id: number }) => {
      const { data } = await api.put(ENDPOINTS.ORDERS.SINGLE(id), payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed");
    },
  });
}

export function useTrackOrder(id: string | number) {
  return useQuery({
    queryKey: ["order", "track", id],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.ORDERS.TRACK(id));
      return data.data;
    },
    enabled: !!id,
  });
}
