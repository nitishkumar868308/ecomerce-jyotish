import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

export interface LocationState {
  id: number;
  name: string;
  code: string;
  countryCode: string;
  isActive: boolean;
  createdAt: string;
}

export function useLocationStates() {
  return useQuery({
    queryKey: ["admin", "locationStates"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<LocationState[]>>(ENDPOINTS.LOCATION.STATES);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<LocationState>) => {
      const { data } = await api.post<ApiResponse<LocationState>>(ENDPOINTS.LOCATION.CREATE_STATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "locationStates"] });
      toast.success("State created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create state");
    },
  });
}

export function useDeleteState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.LOCATION.DELETE_STATE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "locationStates"] });
      toast.success("State deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete state");
    },
  });
}
