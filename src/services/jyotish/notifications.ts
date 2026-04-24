import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

/**
 * React-query hooks for the Jyotish notification feed. Poll-based
 * (15s for unread badge, 10s for recent dropdown) to keep parity with
 * the admin-chat hooks without introducing a websocket stack.
 */

export interface JyotishNotification {
  id: number;
  recipientType: "ASTROLOGER" | "ADMIN";
  recipientId: number | null;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

/* ─────────── Astrologer side ─────────── */

export function useAstrologerNotificationsRecent(
  astrologerId: number | string | null | undefined,
  limit = 10,
) {
  return useQuery({
    queryKey: ["jyotish", "notifications", "astro-recent", astrologerId, limit],
    enabled: !!astrologerId,
    refetchInterval: 10000,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<JyotishNotification[]>>(
        `/jyotish/notifications/astrologer/${astrologerId}/recent`,
        { params: { limit } },
      );
      return data?.data ?? [];
    },
  });
}

export function useAstrologerNotificationsAll(
  astrologerId: number | string | null | undefined,
) {
  return useQuery({
    queryKey: ["jyotish", "notifications", "astro-all", astrologerId],
    enabled: !!astrologerId,
    refetchInterval: 20000,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<JyotishNotification[]>>(
        `/jyotish/notifications/astrologer/${astrologerId}`,
      );
      return data?.data ?? [];
    },
  });
}

export function useAstrologerUnreadCount(
  astrologerId: number | string | null | undefined,
) {
  return useQuery({
    queryKey: ["jyotish", "notifications", "astro-unread", astrologerId],
    enabled: !!astrologerId,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ count: number }>>(
        `/jyotish/notifications/astrologer/${astrologerId}/unread`,
      );
      return data?.data?.count ?? 0;
    },
  });
}

export function useAstrologerMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { astrologerId: number | string; id: number }) => {
      const { data } = await api.post(
        `/jyotish/notifications/astrologer/${args.astrologerId}/mark-read/${args.id}`,
      );
      return data;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({
        queryKey: ["jyotish", "notifications"],
      });
      qc.invalidateQueries({
        queryKey: [
          "jyotish",
          "notifications",
          "astro-unread",
          vars.astrologerId,
        ],
      });
    },
  });
}

export function useAstrologerMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (astrologerId: number | string) => {
      const { data } = await api.post(
        `/jyotish/notifications/astrologer/${astrologerId}/mark-all-read`,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jyotish", "notifications"] });
    },
  });
}

/* ─────────── Admin side ─────────── */

export function useAdminNotificationsRecent(limit = 10) {
  return useQuery({
    queryKey: ["admin", "jyotish", "notifications", "recent", limit],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<JyotishNotification[]>>(
        "/jyotish/notifications/admin/recent",
        { params: { limit } },
      );
      return data?.data ?? [];
    },
  });
}

export function useAdminNotificationsAll() {
  return useQuery({
    queryKey: ["admin", "jyotish", "notifications", "all"],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<JyotishNotification[]>>(
        "/jyotish/notifications/admin",
      );
      return data?.data ?? [];
    },
  });
}

export function useAdminUnreadCount() {
  return useQuery({
    queryKey: ["admin", "jyotish", "notifications", "unread"],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ count: number }>>(
        "/jyotish/notifications/admin/unread",
      );
      return data?.data?.count ?? 0;
    },
  });
}

export function useAdminMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(
        `/jyotish/notifications/admin/mark-read/${id}`,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "jyotish", "notifications"] });
    },
  });
}

export function useAdminMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(
        "/jyotish/notifications/admin/mark-all-read",
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "jyotish", "notifications"] });
    },
  });
}
