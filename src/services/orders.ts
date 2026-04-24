import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Order, CreateOrderPayload } from "@/types/order";
import type {
  ApiResponse,
  OrdersListResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types/api";
import { apiError, apiSuccess } from "@/lib/apiMessage";
import toast from "react-hot-toast";

export function useOrders(params?: PaginationParams) {
  return useQuery<PaginatedResponse<Order>>({
    queryKey: ["orders", params],
    queryFn: async () => {
      const { data } = await api.get<OrdersListResponse<Order> | PaginatedResponse<Order>>(
        ENDPOINTS.ORDERS.LIST,
        { params },
      );
      // Backend may return either nested ({data:{data,meta}}) or flat shape.
      // Normalize so callers can rely on data.data (array) and data.totalPages.
      const inner = (data as any)?.data;
      const isNested = inner && !Array.isArray(inner) && Array.isArray(inner.data);
      if (isNested) {
        const meta = inner.meta ?? {};
        return {
          success: (data as any).success ?? true,
          data: inner.data as Order[],
          total: meta.total ?? inner.data.length,
          page: meta.page ?? params?.page ?? 1,
          limit: meta.limit ?? params?.limit ?? inner.data.length,
          totalPages: meta.totalPages ?? 1,
        };
      }
      return data as PaginatedResponse<Order>;
    },
  });
}

/**
 * Orders placed by the currently signed-in shopper. Backend scopes the
 * query by `userId` so the admin-only GET /orders listing stays off-limits
 * to regular accounts. Returns the same normalised shape as useOrders.
 */
export function useMyOrders(
  userId: number | undefined,
  params?: PaginationParams,
) {
  return useQuery<PaginatedResponse<Order>>({
    queryKey: ["orders", "me", userId, params],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await api.get<any>(ENDPOINTS.ORDERS.ME, {
        params: { ...(params ?? {}), userId },
      });
      const inner = data?.data;
      const isNested =
        inner && !Array.isArray(inner) && Array.isArray(inner.data);
      if (isNested) {
        const meta = inner.meta ?? {};
        return {
          success: data?.success ?? true,
          data: inner.data as Order[],
          total: meta.total ?? inner.data.length,
          page: meta.page ?? params?.page ?? 1,
          limit: meta.limit ?? params?.limit ?? inner.data.length,
          totalPages: meta.totalPages ?? 1,
        };
      }
      if (Array.isArray(data?.data)) {
        return {
          success: data?.success ?? true,
          data: data.data as Order[],
          total: data.data.length,
          page: params?.page ?? 1,
          limit: params?.limit ?? data.data.length,
          totalPages: 1,
        };
      }
      return data as PaginatedResponse<Order>;
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
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success(apiSuccess(data, "Order placed"));
    },
    onError: (error: any) => toast.error(apiError(error)),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Order> & { id: number }) => {
      const { data } = await api.put(ENDPOINTS.ORDERS.SINGLE(id), payload);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success(apiSuccess(data, "Order updated"));
    },
    onError: (error: any) => toast.error(apiError(error)),
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
