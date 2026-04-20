import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { MarketLink } from "@/types/product";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

export interface MarketLinkPayload {
  name: string;
  url: string;
  countryName: string;
  countryCode: string;
  productId?: string | null;
}

export function useMarketLinks(productId?: string) {
  return useQuery({
    queryKey: ["admin", "marketLinks", productId ?? "all"],
    queryFn: async () => {
      const url = productId
        ? ENDPOINTS.MARKET_LINKS.BY_PRODUCT(productId)
        : ENDPOINTS.MARKET_LINKS.LIST;
      const { data } = await api.get<ApiResponse<MarketLink[]>>(url);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateMarketLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MarketLinkPayload) => {
      const { data } = await api.post<ApiResponse<MarketLink>>(
        ENDPOINTS.MARKET_LINKS.CREATE,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "marketLinks"] });
      toast.success("Market link created!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to create market link"),
  });
}

export function useUpdateMarketLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<MarketLinkPayload> & { id: string }) => {
      const { data } = await api.put<ApiResponse<MarketLink>>(
        ENDPOINTS.MARKET_LINKS.UPDATE(id),
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "marketLinks"] });
      toast.success("Market link updated!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to update market link"),
  });
}

export function useDeleteMarketLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(ENDPOINTS.MARKET_LINKS.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "marketLinks"] });
      toast.success("Market link deleted!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to delete market link"),
  });
}
