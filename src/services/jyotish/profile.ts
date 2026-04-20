import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import toast from "react-hot-toast";

export function useAstrologerProfile(id: string | number) {
  return useQuery({
    queryKey: ["jyotish", "astrologer", id],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.ASTROLOGER.SINGLE(id));
      return data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAstrologers() {
  return useQuery({
    queryKey: ["jyotish", "astrologers"],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.ASTROLOGER.LIST);
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateAstrologerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string | number; [key: string]: any }) => {
      const { data } = await api.put(ENDPOINTS.JYOTISH.ASTROLOGER.UPDATE(id), payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["jyotish", "astrologer", variables.id] });
      qc.invalidateQueries({ queryKey: ["jyotish", "astrologers"] });
      toast.success("Profile updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });
}

export function useCreateProfileEditRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { [key: string]: any }) => {
      const { data } = await api.post(ENDPOINTS.JYOTISH.PROFILE_EDIT.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jyotish", "profileEditRequests"] });
      qc.invalidateQueries({ queryKey: ["jyotish", "myProfileEditRequests"] });
      toast.success("Profile edit request submitted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit edit request");
    },
  });
}

export function useMyProfileEditRequests(astrologerId: string | number | undefined) {
  return useQuery({
    queryKey: ["jyotish", "myProfileEditRequests", astrologerId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.PROFILE_EDIT.LIST, {
        params: { astrologerId },
      });
      const list = data?.data ?? data ?? [];
      return list;
    },
    enabled: !!astrologerId,
    staleTime: 30 * 1000,
  });
}
