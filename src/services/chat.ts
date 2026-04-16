import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import toast from "react-hot-toast";

export function useChatSessions() {
  return useQuery({
    queryKey: ["chat", "sessions"],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.CHAT.SESSIONS);
      return data.data;
    },
    staleTime: 0,
  });
}

export function useChatMessages(sessionId: string | number) {
  return useQuery({
    queryKey: ["chat", "messages", sessionId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.CHAT.MESSAGES(sessionId));
      return data.data;
    },
    enabled: !!sessionId,
    staleTime: 0,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      message,
    }: {
      sessionId: string | number;
      message: string;
    }) => {
      const { data } = await api.post(ENDPOINTS.CHAT.SEND(sessionId), { message });
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["chat", "messages", variables.sessionId] });
      qc.invalidateQueries({ queryKey: ["chat", "sessions"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send message");
    },
  });
}
