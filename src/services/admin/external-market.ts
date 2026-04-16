import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { MarketLink } from "@/types/product";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

export function useMarketLinks() {
  return useQuery({
    queryKey: ["admin", "marketLinks"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<MarketLink[]>>(ENDPOINTS.MARKET_LINKS.LIST);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateMarketLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<MarketLink>) => {
      const { data } = await api.post<ApiResponse<MarketLink>>(ENDPOINTS.MARKET_LINKS.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "marketLinks"] });
      toast.success("Market link created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create market link");
    },
  });
}

export function useDeleteMarketLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.MARKET_LINKS.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "marketLinks"] });
      toast.success("Market link deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete market link");
    },
  });
}
