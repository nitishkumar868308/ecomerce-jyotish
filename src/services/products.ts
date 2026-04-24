import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import { useCountryStore } from "@/stores/useCountryStore";
import type { Product, ProductFilters } from "@/types/product";
import type { ApiResponse, PaginatedResponse, ProductsFastResponse } from "@/types/api";
import toast from "react-hot-toast";

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Product>>(ENDPOINTS.PRODUCTS.LIST, {
        params: filters,
      });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductsFast(filters?: ProductFilters) {
  return useQuery({
    queryKey: ["products", "fast", filters],
    queryFn: async () => {
      const { data } = await api.get<ProductsFastResponse<Product>>(ENDPOINTS.PRODUCTS.FAST, {
        params: filters,
      });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllProducts() {
  return useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Product[]>>(ENDPOINTS.PRODUCTS.ALL);
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export interface ProductSearchMatch {
  productId: string;
  name: string;
  slug: string | null;
  image: string | null;
  price: string | null;
  currencySymbol?: string;
  variation?: {
    id: string;
    variationName: string;
    sku: string;
    image: string | null;
    attrs: Array<{ name: string; value: string }>;
  };
  score: number;
}

/**
 * Header autocomplete search. Returns the top `limit` products matching
 * every token in `q` across name/sku/description/tags + every variation's
 * name/sku/attribute combo. QuickGo callers pass city+pincode so results
 * never leak products that aren't locally stocked.
 *
 * `q` is debounced 200ms by the component; this hook just keys on the
 * debounced value + location + platform so react-query de-duplicates
 * identical searches across re-renders.
 */
export function useProductSearch(
  q: string,
  opts?: {
    platform?: "wizard" | "quickgo";
    city?: string;
    pincode?: string;
    limit?: number;
  },
) {
  const trimmed = q.trim();
  // Backend reads the storefront country from the `x-country` request
  // header and converts prices accordingly. React-query keys need to
  // include that country too — otherwise the previous country's cached
  // prices stay on screen after the shopper flips the Topbar picker.
  // QuickGo is always INR (forced in the axios interceptor), so we only
  // factor the country into the key for the wizard surface.
  const countryCode = useCountryStore((s) => s.code);
  const cacheCountry = opts?.platform === "quickgo" ? "IND" : countryCode;
  return useQuery({
    queryKey: [
      "product-search",
      trimmed,
      opts?.platform ?? null,
      opts?.city ?? null,
      opts?.pincode ?? null,
      opts?.limit ?? 10,
      cacheCountry,
    ],
    queryFn: async () => {
      const params: Record<string, string> = { q: trimmed };
      if (opts?.platform) params.platform = opts.platform;
      if (opts?.city) params.city = opts.city;
      if (opts?.pincode) params.pincode = opts.pincode;
      if (opts?.limit) params.limit = String(opts.limit);
      const { data } = await api.get<
        ApiResponse<{ matches: ProductSearchMatch[] }>
      >(ENDPOINTS.PRODUCTS.SEARCH, { params });
      return data.data?.matches ?? [];
    },
    enabled: trimmed.length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useProduct(
  id: string | number,
  opts?: { city?: string; pincode?: string },
) {
  const city = opts?.city;
  const pincode = opts?.pincode;
  return useQuery({
    queryKey: ["product", id, city ?? null, pincode ?? null],
    queryFn: async () => {
      // Backend filters variations to what's locally stocked when both
      // city + pincode are present — omit either and it returns the
      // regular Wizard payload (all variations, no quickgoStock).
      const params: Record<string, string> = {};
      if (city) params.city = city;
      if (pincode) params.pincode = pincode;
      const { data } = await api.get(ENDPOINTS.PRODUCTS.SINGLE(id), {
        params: Object.keys(params).length ? params : undefined,
      });
      return data.data ?? data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData | Partial<Product>) => {
      const { data } = await api.post(ENDPOINTS.PRODUCTS.LIST, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create product");
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Product> & { id: number }) => {
      const { data } = await api.put(ENDPOINTS.PRODUCTS.SINGLE(id), payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update product");
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.PRODUCTS.SINGLE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete product");
    },
  });
}
