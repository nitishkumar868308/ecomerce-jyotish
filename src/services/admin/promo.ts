import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { PromoCode } from "@/types/promo";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/api";
import toast from "react-hot-toast";

export function useAdminPromos(params?: PaginationParams) {
  return useQuery({
    queryKey: ["admin", "promos", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<PromoCode>>(ENDPOINTS.PROMO_CODES.LIST, {
        params,
      });
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminCreatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PromoCode>) => {
      const { data } = await api.post<ApiResponse<PromoCode>>(ENDPOINTS.PROMO_CODES.CREATE, payload);
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
