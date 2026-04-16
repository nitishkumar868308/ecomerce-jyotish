import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Blog } from "@/types/blog";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/api";
import toast from "react-hot-toast";

export function useAdminBlogs(params?: PaginationParams) {
  return useQuery({
    queryKey: ["admin", "blogs", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Blog>>(ENDPOINTS.BLOG.LIST, { params });
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminCreateBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Blog>) => {
      const { data } = await api.post<ApiResponse<Blog>>(ENDPOINTS.BLOG.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "blogs"] });
      qc.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create blog");
    },
  });
}

export function useAdminUpdateBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Blog> & { id: number }) => {
      const { data } = await api.put(ENDPOINTS.BLOG.UPDATE(id), payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "blogs"] });
      qc.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update blog");
    },
  });
}

export function useAdminDeleteBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.BLOG.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "blogs"] });
      qc.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete blog");
    },
  });
}
