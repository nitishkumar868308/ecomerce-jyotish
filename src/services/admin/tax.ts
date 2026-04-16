import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { CountryTax } from "@/types/shipping";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

export function useCountryTaxes() {
  return useQuery({
    queryKey: ["admin", "countryTaxes"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CountryTax[]>>(ENDPOINTS.COUNTRY_TAX.LIST);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateCountryTax() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CountryTax>) => {
      const { data } = await api.post<ApiResponse<CountryTax>>(ENDPOINTS.COUNTRY_TAX.LIST, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "countryTaxes"] });
      toast.success("Country tax created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create country tax");
    },
  });
}
