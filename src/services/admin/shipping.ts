import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { ShippingPrice, CountryPrice } from "@/types/shipping";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

// --- Shipping Pricing ---

export function useShippingPricing() {
  return useQuery({
    queryKey: ["admin", "shippingPricing"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ShippingPrice[]>>(ENDPOINTS.SHIPPING_PRICING.LIST);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateShippingPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ShippingPrice>) => {
      const { data } = await api.post<ApiResponse<ShippingPrice>>(ENDPOINTS.SHIPPING_PRICING.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "shippingPricing"] });
      toast.success("Shipping price created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create shipping price");
    },
  });
}

export function useDeleteShippingPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.SHIPPING_PRICING.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "shippingPricing"] });
      toast.success("Shipping price deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete shipping price");
    },
  });
}

// --- Country Pricing ---

export function useCountryPricing() {
  return useQuery({
    queryKey: ["admin", "countryPricing"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CountryPrice[]>>(ENDPOINTS.COUNTRY_PRICING.LIST);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateCountryPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CountryPrice>) => {
      const { data } = await api.post<ApiResponse<CountryPrice>>(ENDPOINTS.COUNTRY_PRICING.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "countryPricing"] });
      toast.success("Country price created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create country price");
    },
  });
}

export function useDeleteCountryPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.COUNTRY_PRICING.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "countryPricing"] });
      toast.success("Country price deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete country price");
    },
  });
}
