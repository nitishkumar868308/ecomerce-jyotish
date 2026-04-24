import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

/**
 * React-query hooks for the admin↔astrologer support chat. All endpoints
 * live under `/jyotish/admin-chat`. Astrologer-side endpoints are public
 * (the JWT guard we have can't reliably tell astrologer tokens from
 * shopper ones, so we treat the astrologerId passed in the body/path as
 * the source of truth). Admin-side endpoints are gated by JwtAuthGuard +
 * ADMIN role on the backend.
 *
 * We rely on polling (refetchInterval) for new-message delivery because
 * the rest of the app doesn't run a websocket yet — polling on an 8s
 * cadence is fine for chat that averages a few messages per hour.
 */

export interface AdminChatMessage {
  id: number;
  astrologerId: number;
  senderType: "ADMIN" | "ASTROLOGER";
  senderId: number;
  text: string;
  readByAdmin: boolean;
  readByAstro: boolean;
  createdAt: string;
}

/* ─────────────── Astrologer-side hooks ─────────────── */

export function useAstrologerAdminChat(astrologerId: number | string | null | undefined) {
  return useQuery({
    queryKey: ["jyotish", "admin-chat", "astrologer", astrologerId],
    enabled: !!astrologerId,
    refetchInterval: 8000,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AdminChatMessage[]>>(
        `/jyotish/admin-chat/astrologer/${astrologerId}/messages`,
      );
      return data?.data ?? [];
    },
  });
}

export function useAstrologerSendAdminChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { astrologerId: number; text: string }) => {
      const { data } = await api.post<ApiResponse<AdminChatMessage>>(
        "/jyotish/admin-chat/astrologer/send",
        payload,
      );
      return data?.data;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({
        queryKey: ["jyotish", "admin-chat", "astrologer", vars.astrologerId],
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Could not send message.");
    },
  });
}

export function useAstrologerMarkAdminChatRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (astrologerId: number) => {
      const { data } = await api.post(
        `/jyotish/admin-chat/astrologer/${astrologerId}/mark-read`,
      );
      return data;
    },
    onSuccess: (_res, astrologerId) => {
      qc.invalidateQueries({
        queryKey: ["jyotish", "admin-chat", "astrologer", astrologerId],
      });
      qc.invalidateQueries({
        queryKey: ["jyotish", "admin-chat", "astrologer-unread", astrologerId],
      });
    },
  });
}

export function useAstrologerAdminChatUnread(
  astrologerId: number | string | null | undefined,
) {
  return useQuery({
    queryKey: ["jyotish", "admin-chat", "astrologer-unread", astrologerId],
    enabled: !!astrologerId,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ count: number }>>(
        `/jyotish/admin-chat/astrologer/${astrologerId}/unread`,
      );
      return data?.data?.count ?? 0;
    },
  });
}

/* ─────────────── Admin-side hooks ─────────────── */

export interface AdminChatThread {
  astrologer: {
    id: number;
    fullName: string;
    displayName: string | null;
    email: string;
    profile: { image: string | null } | null;
  };
  lastMessage: AdminChatMessage | null;
  unreadForAdmin: number;
}

export function useAdminChatInbox() {
  return useQuery({
    queryKey: ["admin", "astrologer-chat-inbox"],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AdminChatThread[]>>(
        "/jyotish/admin-chat/admin/inbox",
      );
      return data?.data ?? [];
    },
  });
}

export function useAdminChatThread(astrologerId: number | null) {
  return useQuery({
    queryKey: ["admin", "astrologer-chat-thread", astrologerId],
    enabled: astrologerId != null,
    refetchInterval: 8000,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AdminChatMessage[]>>(
        `/jyotish/admin-chat/admin/${astrologerId}/messages`,
      );
      return data?.data ?? [];
    },
  });
}

export function useAdminSendChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { astrologerId: number; text: string }) => {
      const { data } = await api.post<ApiResponse<AdminChatMessage>>(
        `/jyotish/admin-chat/admin/${payload.astrologerId}/send`,
        { text: payload.text },
      );
      return data?.data;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({
        queryKey: ["admin", "astrologer-chat-thread", vars.astrologerId],
      });
      qc.invalidateQueries({ queryKey: ["admin", "astrologer-chat-inbox"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Could not send reply.");
    },
  });
}

export function useAdminMarkChatRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (astrologerId: number) => {
      const { data } = await api.post(
        `/jyotish/admin-chat/admin/${astrologerId}/mark-read`,
      );
      return data;
    },
    onSuccess: (_res, astrologerId) => {
      qc.invalidateQueries({
        queryKey: ["admin", "astrologer-chat-thread", astrologerId],
      });
      qc.invalidateQueries({ queryKey: ["admin", "astrologer-chat-inbox"] });
    },
  });
}
