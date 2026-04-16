import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

export interface Offer {
  id: number;
  title: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  image?: string;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  createdAt: string;
}

export function useOffers() {
  return useQuery({
    queryKey: ["admin", "offers"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Offer[]>>(ENDPOINTS.OFFERS.LIST);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Offer>) => {
      const { data } = await api.post<ApiResponse<Offer>>(ENDPOINTS.OFFERS.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "offers"] });
      toast.success("Offer created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create offer");
    },
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Offer> & { id: number }) => {
      const { data } = await api.put(ENDPOINTS.OFFERS.UPDATE(id), payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "offers"] });
      toast.success("Offer updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update offer");
    },
  });
}

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.OFFERS.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "offers"] });
      toast.success("Offer deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete offer");
    },
  });
}
