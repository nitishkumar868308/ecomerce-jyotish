import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import toast from "react-hot-toast";

export function useAstrologerEarnings(astrologerId?: string | number) {
  return useQuery({
    queryKey: ["jyotish", "chat", "earnings", astrologerId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.CHAT.EARNINGS, {
        params: astrologerId != null ? { astrologerId } : undefined,
      });
      return data.data;
    },
    enabled: astrologerId != null,
    staleTime: 0,
    refetchInterval: 10000,
  });
}

export interface AstrologerFreeOfferSummary {
  activeOffer: {
    id: number;
    title: string;
    minutesPerSession: number;
    usesPerUser: number;
    startDate: string | null;
    endDate: string | null;
  } | null;
  totalFreeSessions: number;
}

export function useAstrologerFreeOfferSummary(
  astrologerId?: string | number,
) {
  return useQuery({
    queryKey: ["jyotish", "chat", "free-offer-summary", astrologerId],
    queryFn: async () => {
      const { data } = await api.get<{ data: AstrologerFreeOfferSummary }>(
        "/jyotish/chat/free-offer-summary",
        { params: { astrologerId } },
      );
      return data.data;
    },
    enabled: astrologerId != null,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export interface AstrologerFreeOfferRow {
  id: number;
  astrologerId: number;
  title: string;
  description: string | null;
  source: string;
  minutesPerSession: number;
  usesPerUser: number;
  ratePerMinuteAfter: number;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  createdAt: string;
  astrologer?: {
    id: number;
    fullName?: string;
    displayName?: string;
    email?: string;
  };
  _count?: { usages: number; sessions: number };
}

export function useAstrologerFreeOffersAdmin() {
  return useQuery({
    queryKey: ["admin", "jyotish", "astrologer-free-offers"],
    queryFn: async () => {
      const { data } = await api.get<{ data: AstrologerFreeOfferRow[] }>(
        "/jyotish/chat/astrologer-offers",
      );
      return data.data ?? [];
    },
    staleTime: 15_000,
  });
}

export function useSetAstrologerFreeOfferActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: number; active: boolean }) => {
      const { data } = await api.patch(
        `/jyotish/chat/astrologer-offers/${args.id}/active`,
        { active: args.active },
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin", "jyotish", "astrologer-free-offers"],
      });
      qc.invalidateQueries({
        queryKey: ["jyotish", "chat", "free-offer-summary"],
      });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update offer status",
      );
    },
  });
}

export function useAdminJyotishTransactions(opts?: {
  astrologerId?: string | number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["jyotish", "chat", "admin-transactions", opts],
    queryFn: async () => {
      const { data } = await api.get(
        ENDPOINTS.JYOTISH.CHAT.ADMIN_TRANSACTIONS,
        {
          params: {
            astrologerId: opts?.astrologerId ?? undefined,
            limit: opts?.limit ?? undefined,
          },
        },
      );
      return data.data;
    },
    staleTime: 0,
    refetchInterval: 15000,
  });
}

export function useMyChatHistory(userId?: string | number) {
  return useQuery({
    queryKey: ["jyotish", "chat", "my-history", userId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.CHAT.MY_HISTORY, {
        params: userId != null ? { userId } : undefined,
      });
      return data.data;
    },
    enabled: userId != null,
    staleTime: 0,
    refetchInterval: 10000,
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      sessionId: number;
      userId: number;
      rating: number;
      comment?: string;
    }) => {
      const { data } = await api.post(
        ENDPOINTS.JYOTISH.CHAT.REVIEW(payload.sessionId),
        {
          userId: payload.userId,
          rating: payload.rating,
          comment: payload.comment,
        },
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jyotish", "chat", "my-history"] });
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || "Failed to submit review"),
  });
}

export function useUserActiveSession(userId?: string | number) {
  return useQuery({
    queryKey: ["jyotish", "chat", "user-active", userId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.CHAT.USER_ACTIVE, {
        params: userId != null ? { userId } : undefined,
      });
      return data.data; // nullable — null when no active session
    },
    enabled: userId != null,
    staleTime: 0,
    // Banner exists to nudge a user back into a live chat — 4s poll
    // strikes a balance between "feels current" and "don't thrash
    // the server while they're browsing".
    refetchInterval: 4000,
    refetchOnWindowFocus: true,
  });
}

export function useAllChatRequests(astrologerId?: string | number) {
  return useQuery({
    queryKey: ["jyotish", "chat", "requests", astrologerId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.CHAT.REQUESTS, {
        params: astrologerId != null ? { astrologerId } : undefined,
      });
      return data.data;
    },
    enabled: astrologerId != null,
    staleTime: 0,
    // Faster than missed-only because this page may show live pending
    // rows the astrologer can act on from the list.
    refetchInterval: 5000,
  });
}

export function useMissedChatRequests(astrologerId?: string | number) {
  return useQuery({
    queryKey: ["jyotish", "chat", "missed", astrologerId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.CHAT.MISSED, {
        params: astrologerId != null ? { astrologerId } : undefined,
      });
      return data.data;
    },
    enabled: astrologerId != null,
    staleTime: 0,
    // Slower cadence than the live inbox — missed requests don't need
    // to feel "live" and this page is browsed, not watched.
    refetchInterval: 15000,
  });
}

export function useJyotishChatSessions(astrologerId?: string | number) {
  return useQuery({
    queryKey: ["jyotish", "chat", "sessions", astrologerId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.CHAT.SESSIONS, {
        params: astrologerId != null ? { astrologerId } : undefined,
      });
      return data.data;
    },
    enabled: astrologerId != null,
    staleTime: 0,
    // Poll every 5s while the dashboard is open so a fresh PENDING
    // request surfaces to the astrologer without a refresh. Shorter
    // intervals turned into wasted server calls when the dashboard sits
    // idle for minutes; 5s is the sweet spot the ops team landed on.
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useStartChatSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { astrologerId: string | number; [key: string]: any }) => {
      const { data } = await api.post(ENDPOINTS.JYOTISH.CHAT.START, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jyotish", "chat", "sessions"] });
      toast.success("Chat session started!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to start session");
    },
  });
}

export function useJyotishChatSession(
  id: string | number,
  opts?: { pollMs?: number },
) {
  return useQuery({
    queryKey: ["jyotish", "chat", "session", id],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.CHAT.SESSION(id));
      return data.data;
    },
    enabled: !!id,
    staleTime: 0,
    refetchInterval: opts?.pollMs ?? false,
  });
}

export function useAcceptChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { sessionId: number; astrologerId: number }) => {
      const { data } = await api.post(ENDPOINTS.JYOTISH.CHAT.ACCEPT, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jyotish", "chat", "sessions"] });
      qc.invalidateQueries({ queryKey: ["jyotish", "chat", "session"] });
      toast.success("Chat accepted — timer started");
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || "Failed to accept"),
  });
}

export function useRejectChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      sessionId: number;
      astrologerId: number;
      reason?: string;
    }) => {
      const { data } = await api.post(ENDPOINTS.JYOTISH.CHAT.REJECT, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jyotish", "chat", "sessions"] });
      toast.success("Chat rejected");
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || "Failed to reject"),
  });
}

export function useEndChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { sessionId: number }) => {
      const { data } = await api.post(ENDPOINTS.JYOTISH.CHAT.END, payload);
      return data;
    },
    // Optimistic: flip the cached session to ENDED the instant the
    // user confirms. Keeps the UI from looking "stuck" while the
    // request is in flight — the banner, chat page guards and billing
    // strip all react to status, so they update without waiting for
    // the next 3s poll.
    onMutate: async (vars) => {
      const singleKey = [
        "jyotish",
        "chat",
        "session",
        String(vars.sessionId),
      ];
      const altKey = ["jyotish", "chat", "session", vars.sessionId];
      await qc.cancelQueries({ queryKey: singleKey });
      const prev = qc.getQueryData<any>(singleKey) ?? qc.getQueryData<any>(altKey);
      if (prev) {
        const patched = {
          ...prev,
          status: "ENDED",
          endedAt: new Date().toISOString(),
          endReason: "manual",
        };
        qc.setQueryData(singleKey, patched);
        qc.setQueryData(altKey, patched);
      }
      return { prev, singleKey, altKey };
    },
    onError: (error: any, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(ctx.singleKey, ctx.prev);
        qc.setQueryData(ctx.altKey, ctx.prev);
      }
      toast.error(error.response?.data?.message || "Failed to end chat");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jyotish", "chat", "sessions"] });
      qc.invalidateQueries({ queryKey: ["jyotish", "chat", "session"] });
      qc.invalidateQueries({ queryKey: ["jyotish", "chat", "user-active"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      toast.success("Chat ended");
    },
  });
}
