import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/api";
import toast from "react-hot-toast";

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  platform?: string | null;
  isRead: boolean;
  repliedAt?: string | null;
  createdAt: string;
}

export function useContactMessages(params?: PaginationParams) {
  return useQuery({
    queryKey: ["admin", "contactMessages", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ContactMessage>>(
        ENDPOINTS.CONTACT.LIST,
        { params },
      );
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export interface ContactReplyPayload {
  subject: string;
  body: string;
}

export function useReplyContactMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ContactReplyPayload & { id: number }) => {
      const { data } = await api.post<ApiResponse<{ sent: boolean }>>(
        ENDPOINTS.CONTACT.REPLY(id),
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "contactMessages"] });
      toast.success("Reply sent!");
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || "Failed to send reply"),
  });
}

export function useMarkContactRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.patch(ENDPOINTS.CONTACT.MARK_READ(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "contactMessages"] }),
  });
}

export function useDeleteContactMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.CONTACT.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "contactMessages"] });
      toast.success("Message deleted!");
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || "Failed to delete message"),
  });
}
