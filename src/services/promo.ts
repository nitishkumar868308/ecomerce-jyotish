import { useMutation, useQuery } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import toast from "react-hot-toast";

export interface ActivePromoCode {
  id: number;
  code: string;
  discountType: "FLAT" | "PERCENTAGE" | string;
  discountValue: number;
  validTill: string;
  appliesTo?: "ALL_USERS" | "SPECIFIC_USERS" | string;
  /** Total usageLimit has been consumed — nobody else can apply it. */
  exhausted?: boolean;
  /** This shopper has already claimed the code on a previous order. */
  usedByUser?: boolean;
}

export function useApplyPromo() {
  return useMutation({
    mutationFn: async (payload: { code: string; cartTotal: number; [key: string]: any }) => {
      const { data } = await api.post(ENDPOINTS.PROMO_CODES.APPLY, payload);
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(data.message || "Promo code applied!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Invalid promo code");
    },
  });
}

// Public list of promo codes visible to the signed-in shopper at
// checkout. Passes `userId` so the backend can include private
// (specific-user) codes when this shopper qualifies and tag each row
// with per-user usage flags.
export function useActivePromoCodes(userId?: number) {
  return useQuery({
    queryKey: ["promo-codes", "active", userId ?? null],
    queryFn: async (): Promise<ActivePromoCode[]> => {
      const { data } = await api.get(ENDPOINTS.PROMO_CODES.ACTIVE, {
        params: userId ? { userId } : undefined,
      });
      return data?.data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });
}
