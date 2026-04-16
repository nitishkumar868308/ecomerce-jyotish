import { useMutation } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import toast from "react-hot-toast";

export function useInitCashfreePayment() {
  return useMutation({
    mutationFn: async (payload: { orderId: string | number; [key: string]: any }) => {
      const { data } = await api.post(ENDPOINTS.PAYMENTS.CASHFREE_INIT, payload);
      return data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to initialize payment");
    },
  });
}

export function useVerifyPayment() {
  return useMutation({
    mutationFn: async (payload: { orderId: string | number; [key: string]: any }) => {
      const { data } = await api.post(ENDPOINTS.ORDERS.VERIFY, payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Payment verified!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Payment verification failed");
    },
  });
}
