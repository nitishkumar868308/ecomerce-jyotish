import { useQuery } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { PaginatedResponse, PaginationParams } from "@/types/api";

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function useContactMessages(params?: PaginationParams) {
  return useQuery({
    queryKey: ["admin", "contactMessages", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ContactMessage>>(ENDPOINTS.CONTACT.LIST, {
        params,
      });
      return data;
    },
    staleTime: 60 * 1000,
  });
}
