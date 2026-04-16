import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

export interface Donation {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  amount: number;
  currency: string;
  countryCode: string;
  message?: string;
  paymentStatus: string;
  createdAt: string;
}

export function useDonations() {
  return useQuery({
    queryKey: ["admin", "donations"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Donation[]>>(ENDPOINTS.DONATIONS.LIST);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Donation>) => {
      const { data } = await api.post<ApiResponse<Donation>>(ENDPOINTS.DONATIONS.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "donations"] });
      toast.success("Donation recorded!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to record donation");
    },
  });
}
