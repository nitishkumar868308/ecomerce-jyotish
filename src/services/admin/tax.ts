import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { CountryTax } from "@/types/shipping";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

export function useCountryTaxes() {
  return useQuery({
    queryKey: ["admin", "countryTaxes"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CountryTax[]>>(
        ENDPOINTS.COUNTRY_TAX.LIST,
      );
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateCountryTax() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CountryTax>) => {
      const { data } = await api.post<ApiResponse<CountryTax>>(
        ENDPOINTS.COUNTRY_TAX.LIST,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "countryTaxes"] });
      toast.success("Tax rule created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create tax rule");
    },
  });
}

export function useUpdateCountryTax() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<CountryTax> & { id: number }) => {
      const { data } = await api.put<ApiResponse<CountryTax>>(
        ENDPOINTS.COUNTRY_TAX.UPDATE(id),
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "countryTaxes"] });
      toast.success("Tax rule updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update tax rule");
    },
  });
}

export function useDeleteCountryTax() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.COUNTRY_TAX.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "countryTaxes"] });
      toast.success("Tax rule deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete tax rule");
    },
  });
}
