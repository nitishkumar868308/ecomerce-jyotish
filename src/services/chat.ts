import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import toast from "react-hot-toast";

/**
 * Jyotish chat-room hooks. Messages poll fast (1s) and use optimistic
 * updates on send so the sender sees their own message instantly,
 * before the server round-trip. Typing + status live in lighter-weight
 * siblings so the chat header can update continuously without re-
 * fetching the message blob.
 */

interface ChatMessage {
  id?: number;
  _id?: string;
  sessionId: number;
  senderType: "USER" | "ASTROLOGER";
  senderId: number;
  text?: string;
  message?: string;
  createdAt?: string;
  pending?: boolean;
}

export function useChatMessages(sessionId: string | number) {
  return useQuery<ChatMessage[]>({
    queryKey: ["jyotish", "chat", "messages", sessionId],
    queryFn: async () => {
      const { data } = await api.get(
        ENDPOINTS.JYOTISH.CHAT.MESSAGES(sessionId),
      );
      return data.data;
    },
    enabled: !!sessionId,
    staleTime: 0,
    // 1s poll — deliberately tight so the other side's replies feel
    // near-live. Real-time would need a socket; this is the lightest
    // REST compromise.
    refetchInterval: 1000,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      text,
      senderType,
      senderId,
    }: {
      sessionId: string | number;
      text: string;
      senderType: "USER" | "ASTROLOGER";
      senderId: number;
    }) => {
      const { data } = await api.post(ENDPOINTS.JYOTISH.CHAT.SEND(sessionId), {
        senderType,
        senderId,
        text,
      });
      return data;
    },
    // Optimistic update: shove the message into the local cache
    // immediately with `pending: true` so the sender sees it before
    // the server responds. On error we roll back; on success we let
    // the 1s poll refresh the canonical list.
    onMutate: async (vars) => {
      const key = ["jyotish", "chat", "messages", vars.sessionId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ChatMessage[]>(key);
      const optimistic: ChatMessage = {
        id: -Date.now(),
        sessionId: Number(vars.sessionId),
        senderType: vars.senderType,
        senderId: vars.senderId,
        text: vars.text,
        createdAt: new Date().toISOString(),
        pending: true,
      };
      qc.setQueryData<ChatMessage[]>(key, [...(previous ?? []), optimistic]);
      return { previous };
    },
    onError: (error: any, vars, ctx) => {
      const key = ["jyotish", "chat", "messages", vars.sessionId];
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error(error.response?.data?.message || "Failed to send message");
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({
        queryKey: ["jyotish", "chat", "messages", vars.sessionId],
      });
    },
  });
}

export function useSendTyping() {
  return useMutation({
    mutationFn: async ({
      sessionId,
      senderType,
    }: {
      sessionId: string | number;
      senderType: "USER" | "ASTROLOGER";
    }) => {
      // Fire-and-forget — we never await the response on the caller
      // side and intentionally swallow errors; "typing…" is cosmetic.
      return api.post(ENDPOINTS.JYOTISH.CHAT.TYPING(sessionId), {
        senderType,
      });
    },
  });
}

export function useSendAddingMoneyHeartbeat() {
  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string | number }) => {
      return api.post(ENDPOINTS.JYOTISH.CHAT.ADDING_MONEY(sessionId), {});
    },
  });
}

export interface ChatLiveStatus {
  id: number;
  status: string;
  startedAt?: string | null;
  endedAt?: string | null;
  endReason?: string | null;
  pricePerMinute: number;
  minutesBilled: number;
  secondsBilled?: number;
  totalCharged: number;
  gstAmount?: number;
  astrologerEarning?: number;
  adminEarning?: number;
  /** Offer granted at accept (in minutes). 0 when no offer applied. */
  freeMinutesGranted?: number;
  /** Live countdown — how many seconds of the free window remain
   *  right now. Drops to 0 once paid billing kicks in. */
  freeSecondsLeft?: number;
  walletBalance: number;
  typing: { user: boolean; astrologer: boolean };
  /** Shopper has the Add-money modal open. Astrologer UI shows a
   *  "user is topping up" indicator so they don't end the session
   *  while the shopper is actively solving the balance problem. */
  userAddingMoney?: boolean;
}

export function useChatLiveStatus(sessionId: string | number) {
  return useQuery<ChatLiveStatus>({
    queryKey: ["jyotish", "chat", "status", sessionId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.CHAT.STATUS(sessionId));
      return data.data;
    },
    enabled: !!sessionId,
    staleTime: 0,
    // 1.5s — fast enough that "typing…" feels live, infrequent enough
    // that we're not hammering the wallet read every 300ms.
    refetchInterval: 1500,
  });
}
