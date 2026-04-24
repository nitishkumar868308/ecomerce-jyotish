import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Blog } from "@/types/blog";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/api";
import toast from "react-hot-toast";

export function useBlogs(params?: PaginationParams) {
  return useQuery({
    queryKey: ["blogs", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Blog>>(ENDPOINTS.BLOG.LIST, { params });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlog(slugOrId: string | number) {
  return useQuery({
    queryKey: ["blog", slugOrId],
    queryFn: async () => {
      // Backend resolves a single post via the list endpoint with ?slug=… —
      // there's no `/blog/:slug` GET route. Hitting that path was returning
      // the 404 that surfaced as "Post not found".
      const { data } = await api.get<ApiResponse<Blog>>(ENDPOINTS.BLOG.LIST, {
        params: { slug: String(slugOrId) },
      });
      return data.data;
    },
    enabled: !!slugOrId,
  });
}

export function useCreateBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Blog>) => {
      const { data } = await api.post(ENDPOINTS.BLOG.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed");
    },
  });
}

export function useUpdateBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Blog> & { id: number }) => {
      const { data } = await api.put(ENDPOINTS.BLOG.UPDATE(id), payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed");
    },
  });
}

export function useDeleteBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.BLOG.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed");
    },
  });
}
