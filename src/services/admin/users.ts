import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { User } from "@/types/user";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

// Backend GET /auth/getAllUser returns a flat list under {data:[...]}.
export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<User[]>>(
        ENDPOINTS.AUTH.GET_ALL_USERS,
      );
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<User> & { id: number }) => {
      const { data } = await api.put(ENDPOINTS.AUTH.UPDATE_USER, {
        id,
        ...payload,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update user");
    },
  });
}

export function useAdminDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.AUTH.DELETE_USER(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete user");
    },
  });
}
