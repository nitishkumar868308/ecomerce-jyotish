import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
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

export function useProduct(id: string | number) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.PRODUCTS.SINGLE(id));
      // Backend may return { success, data } wrapper or direct product
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
