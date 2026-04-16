import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Category, Subcategory } from "@/types/category";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Category[]>>(ENDPOINTS.CATEGORIES.LIST);
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategory(id: string | number) {
  return useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Category>>(ENDPOINTS.CATEGORIES.SINGLE(id));
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData | Partial<Category>) => {
      const { data } = await api.post(ENDPOINTS.CATEGORIES.LIST, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed");
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Category> & { id: number }) => {
      const { data } = await api.put(ENDPOINTS.CATEGORIES.SINGLE(id), payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed");
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.CATEGORIES.SINGLE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed");
    },
  });
}

export function useSubcategories(categoryId?: number) {
  return useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: async () => {
      const url = categoryId
        ? ENDPOINTS.SUBCATEGORIES.BY_CATEGORY(categoryId)
        : ENDPOINTS.SUBCATEGORIES.LIST;
      const { data } = await api.get<ApiResponse<Subcategory[]>>(url);
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSubcategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData | Partial<Subcategory>) => {
      const { data } = await api.post(ENDPOINTS.SUBCATEGORIES.LIST, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success("Subcategory created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed");
    },
  });
}

export function useUpdateSubcategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Subcategory> & { id: number }) => {
      const { data } = await api.put(ENDPOINTS.SUBCATEGORIES.SINGLE(id), payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success("Subcategory updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed");
    },
  });
}

export function useDeleteSubcategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.SUBCATEGORIES.SINGLE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success("Subcategory deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed");
    },
  });
}
