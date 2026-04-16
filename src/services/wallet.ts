import { useQuery } from "@tanstack/react-query";
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
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 0,
  });
}
