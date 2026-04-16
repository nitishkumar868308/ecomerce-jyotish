import { useMutation } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import toast from "react-hot-toast";

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
