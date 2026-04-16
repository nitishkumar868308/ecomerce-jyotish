import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { User } from "@/types/user";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/api";
import toast from "react-hot-toast";

export function useAdminUsers(params?: PaginationParams) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<User>>(ENDPOINTS.AUTH.GET_ALL_USERS, {
        params,
      });
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<User> & { id: number }) => {
      const { data } = await api.put(ENDPOINTS.AUTH.UPDATE_USER, { id, ...payload });
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
