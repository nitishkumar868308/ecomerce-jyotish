import { useQuery } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";

export function useAstrologerWallet() {
  return useQuery({
    queryKey: ["jyotish", "wallet"],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.WALLET.BALANCE);
      return data.data;
    },
    staleTime: 0,
  });
}

export function useAstrologerTransactions(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["jyotish", "wallet", "transactions", params],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.WALLET.TRANSACTIONS, { params });
      return data;
    },
    staleTime: 0,
  });
}
