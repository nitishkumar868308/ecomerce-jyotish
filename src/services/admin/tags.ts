import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Tag } from "@/types/product";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

export function useTags() {
  return useQuery({
    queryKey: ["admin", "tags"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Tag[]>>(ENDPOINTS.TAGS.LIST);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Tag>) => {
      const { data } = await api.post<ApiResponse<Tag>>(ENDPOINTS.TAGS.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tags"] });
      toast.success("Tag created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create tag");
    },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.TAGS.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tags"] });
      toast.success("Tag deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete tag");
    },
  });
}
