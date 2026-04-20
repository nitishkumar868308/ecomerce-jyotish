import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Product } from "@/types/product";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

// Backend GET /products/all is admin-only; it returns a flat Product[] wrapped
// in the standard ApiResponse envelope. No pagination meta here — pagination
// is handled client-side by the admin list page.
export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Product[]>>(
        ENDPOINTS.PRODUCTS.ALL,
      );
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminProduct(id: string | number) {
  return useQuery({
    queryKey: ["admin", "product", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Product>>(
        ENDPOINTS.PRODUCTS.SINGLE(id),
      );
      return data.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useAdminCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Product> & Record<string, unknown>) => {
      const { data } = await api.post<ApiResponse<Product>>(
        ENDPOINTS.PRODUCTS.LIST,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to create product"),
  });
}

export function useAdminUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    // Backend expects id in the body.
    mutationFn: async (
      payload: Partial<Product> & Record<string, unknown> & { id: string },
    ) => {
      const { data } = await api.put<ApiResponse<Product>>(
        ENDPOINTS.PRODUCTS.LIST,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to update product"),
  });
}

export function useAdminToggleProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { data } = await api.patch<ApiResponse<Product>>(
        ENDPOINTS.PRODUCTS.LIST,
        { id, active },
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to toggle product"),
  });
}

export function useAdminDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(ENDPOINTS.PRODUCTS.LIST, { data: { id } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to delete product"),
  });
}

/** Live SKU availability check used by the product form. */
export async function checkProductSku(sku: string, ignoreId?: string) {
  const { data } = await api.get<{ success: true; data: { available: boolean } }>(
    ENDPOINTS.PRODUCTS.CHECK_SKU,
    { params: { sku, ignoreId } },
  );
  return data.data.available;
}
