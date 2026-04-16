import { useQuery } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";

export function useShippingByCountry(code: string) {
  return useQuery({
    queryKey: ["shipping", "country", code],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.SHIPPING_PRICING.BY_COUNTRY(code));
      return data.data;
    },
    enabled: !!code,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCountryPricingList() {
  return useQuery({
    queryKey: ["countryPricing"],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.COUNTRY_PRICING.LIST);
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
