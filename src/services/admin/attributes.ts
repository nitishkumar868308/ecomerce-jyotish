import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

export interface Attribute {
  id: number;
  name: string;
  values: string[];
  active: boolean;
  deleted?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttributePayload {
  name: string;
  values: string[];
  active?: boolean;
}

export function useAttributes(opts?: { fresh?: boolean }) {
  return useQuery({
    queryKey: ["admin", "attributes"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Attribute[]>>(
        ENDPOINTS.ATTRIBUTES.LIST,
      );
      return data.data;
    },
    staleTime: opts?.fresh ? 0 : 60 * 1000,
    refetchOnWindowFocus: opts?.fresh ? true : undefined,
    refetchOnMount: opts?.fresh ? "always" : undefined,
  });
}

export function useCreateAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AttributePayload) => {
      const { data } = await api.post<ApiResponse<Attribute>>(
        ENDPOINTS.ATTRIBUTES.CREATE,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "attributes"] });
      toast.success("Attribute created!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to create attribute"),
  });
}

export function useUpdateAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<AttributePayload> & { id: number }) => {
      const { data } = await api.put<ApiResponse<Attribute>>(
        ENDPOINTS.ATTRIBUTES.UPDATE(id),
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "attributes"] });
      toast.success("Attribute updated!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to update attribute"),
  });
}

export function useDeleteAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.ATTRIBUTES.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "attributes"] });
      toast.success("Attribute deleted!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to delete attribute"),
  });
}
