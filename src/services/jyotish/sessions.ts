import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import toast from "react-hot-toast";

export function useJyotishChatSessions() {
  return useQuery({
    queryKey: ["jyotish", "chat", "sessions"],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.CHAT.SESSIONS);
      return data.data;
    },
    staleTime: 0,
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

export function useJyotishChatSession(id: string | number) {
  return useQuery({
    queryKey: ["jyotish", "chat", "session", id],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.CHAT.SESSION(id));
      return data.data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}
