import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import { apiError } from "@/lib/apiMessage";
import toast from "react-hot-toast";

export type NotificationAs = "USER" | "ADMIN" | "ASTROLOGER";

export interface AppNotification {
  id: number;
  recipientType: NotificationAs;
  recipientId: number | null;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  read: boolean;
  readAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export function useNotifications(as: NotificationAs = "USER") {
  return useQuery({
    queryKey: ["notifications", as],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.NOTIFICATIONS.LIST, {
        params: { as },
      });
      return (data?.data ?? []) as AppNotification[];
    },
    // Polling keeps the bell fresh without a dedicated websocket.
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (err: any) => toast.error(apiError(err)),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (as: NotificationAs = "USER") => {
      const { data } = await api.post(
        ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
        undefined,
        { params: { as } },
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (err: any) => toast.error(apiError(err)),
  });
}
