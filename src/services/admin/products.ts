import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Product, ProductFilters } from "@/types/product";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import toast from "react-hot-toast";

export function useAdminProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ["admin", "products", filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Product>>(ENDPOINTS.PRODUCTS.LIST, {
        params: filters,
      });
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminProduct(id: string | number) {
  return useQuery({
    queryKey: ["admin", "product", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Product>>(ENDPOINTS.PRODUCTS.SINGLE(id));
      return data.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useAdminCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData | Partial<Product>) => {
      const { data } = await api.post(ENDPOINTS.PRODUCTS.LIST, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create product");
    },
  });
}

export function useAdminUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Product> & { id: number }) => {
      const { data } = await api.put(ENDPOINTS.PRODUCTS.SINGLE(id), payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update product");
    },
  });
}

export function useAdminDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.PRODUCTS.SINGLE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete product");
    },
  });
}
