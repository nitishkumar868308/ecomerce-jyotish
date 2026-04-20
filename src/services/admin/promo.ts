import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { PromoCode, PromoUsage } from "@/types/promo";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/api";
import toast from "react-hot-toast";

export function useAdminPromos(params?: PaginationParams) {
  return useQuery({
    queryKey: ["admin", "promos", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<PromoCode>>(
        ENDPOINTS.PROMO_CODES.LIST,
        { params },
      );
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminCreatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PromoCode>) => {
      const { data } = await api.post<ApiResponse<PromoCode>>(
        ENDPOINTS.PROMO_CODES.CREATE,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "promos"] });
      toast.success("Promo code created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create promo code");
    },
  });
}

export function useAdminUpdatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<PromoCode> & { id: number }) => {
      const { data } = await api.put<ApiResponse<PromoCode>>(
        ENDPOINTS.PROMO_CODES.UPDATE(id),
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "promos"] });
      toast.success("Promo code updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update promo code");
    },
  });
}

export function useAdminDeletePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.PROMO_CODES.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "promos"] });
      toast.success("Promo code deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete promo code");
    },
  });
}

export function useAdminPromoUsage(params?: PaginationParams) {
  return useQuery({
    queryKey: ["admin", "promoUsage", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<PromoUsage>>(
        ENDPOINTS.PROMO_CODES.USAGE,
        { params },
      );
      return data;
    },
    staleTime: 60 * 1000,
    // Gracefully resolve to an empty list if the backend route isn't deployed yet.
    retry: false,
  });
}
