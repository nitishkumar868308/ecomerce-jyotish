import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import toast from "react-hot-toast";

export function useDonations(countryCode?: string) {
  return useQuery({
    queryKey: ["donations", countryCode],
    queryFn: async () => {
      const url = countryCode
        ? ENDPOINTS.DONATIONS.BY_COUNTRY(countryCode)
        : ENDPOINTS.DONATIONS.LIST;
      const { data } = await api.get(url);
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { amount: number; [key: string]: any }) => {
      const { data } = await api.post(ENDPOINTS.DONATIONS.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donations"] });
      toast.success("Donation created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create donation");
    },
  });
}
