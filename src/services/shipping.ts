import { useQuery } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";

export interface ShippingOption {
  id: number;
  countryCode: string;
  /** Admin-facing label shown in the method picker, e.g. "Standard". */
  name?: string | null;
  /** Alternative label some backends use. Checkout falls back to this. */
  method?: string | null;
  price: number | string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function useShippingByCountry(code: string) {
  return useQuery<ShippingOption[]>({
    queryKey: ["shipping", "country", code],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.SHIPPING_PRICING.BY_COUNTRY(code));
      return (data?.data ?? []) as ShippingOption[];
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
