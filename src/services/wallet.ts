import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";

export function useWalletBalance() {
  const { isLoggedIn } = useAuthStore();
  return useQuery({
    queryKey: ["wallet", "balance"],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.WALLET.BALANCE);
      return data.data;
    },
    enabled: isLoggedIn,
    staleTime: 0,
  });
}

export function useWalletTransactions(params?: { page?: number; limit?: number }) {
  const { isLoggedIn } = useAuthStore();
  return useQuery({
    queryKey: ["wallet", "transactions", params],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.WALLET.TRANSACTIONS, { params });
      return data.data;
    },
    enabled: isLoggedIn,
    staleTime: 0,
  });
}

export function useAddMoneyToWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { amount: number; note?: string }) => {
      const { data } = await api.post(ENDPOINTS.WALLET.TOPUP, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet", "balance"] });
      qc.invalidateQueries({ queryKey: ["wallet", "transactions"] });
    },
  });
}
