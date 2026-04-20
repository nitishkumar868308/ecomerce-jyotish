import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

/** Typed discount shapes — must match backend CreateOfferDto docs. */
export type OfferDiscountType = "RANGE_FREE" | "PERCENTAGE";

export interface RangeFreeDiscount {
  from: number;
  to: number;
  freeCount: number;
}
export interface PercentageDiscount {
  minQty: number;
  percent: number;
}

export type OfferDiscountValue = RangeFreeDiscount | PercentageDiscount;

export interface Offer {
  id: number;
  name: string;
  discountType: OfferDiscountType | string;
  discountValue: OfferDiscountValue | Record<string, number>;
  type: Record<string, unknown>;
  description?: string | null;
  active: boolean;
  deleted?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OfferPayload {
  name: string;
  discountType: OfferDiscountType | string;
  discountValue: OfferDiscountValue;
  type?: Record<string, unknown>;
  description?: string;
  active?: boolean;
}

export function useOffers() {
  return useQuery({
    queryKey: ["admin", "offers"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Offer[]>>(
        ENDPOINTS.OFFERS.LIST,
      );
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OfferPayload) => {
      const { data } = await api.post<ApiResponse<Offer>>(
        ENDPOINTS.OFFERS.CREATE,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "offers"] });
      toast.success("Offer created!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to create offer"),
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<OfferPayload> & { id: number }) => {
      // Backend expects id in the body.
      const { data } = await api.put<ApiResponse<Offer>>(
        ENDPOINTS.OFFERS.UPDATE,
        { id, ...payload },
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "offers"] });
      toast.success("Offer updated!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to update offer"),
  });
}

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.OFFERS.DELETE, { data: { id } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "offers"] });
      toast.success("Offer deleted!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to delete offer"),
  });
}
