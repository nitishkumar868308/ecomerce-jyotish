import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Address } from "@/types/user";
import type { ApiResponse } from "@/types/api";
import { useAuthStore } from "@/stores/useAuthStore";

export function useAddresses() {
  const { isLoggedIn } = useAuthStore();
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Address[]>>(ENDPOINTS.ADDRESS.LIST);
      return data.data;
    },
    enabled: isLoggedIn,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Address, "id" | "userId" | "createdAt">) => {
      const { data } = await api.post(ENDPOINTS.ADDRESS.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Address> & { id: number }) => {
      const { data } = await api.put(ENDPOINTS.ADDRESS.UPDATE(id), payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(ENDPOINTS.ADDRESS.DELETE(id));
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}
