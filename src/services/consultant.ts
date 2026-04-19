import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import toast from "react-hot-toast";

export function useConsultantServices() {
  return useQuery({
    queryKey: ["consultant", "services"],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.BOOK_CONSULTANT.SERVICES.LIST);
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useConsultantSlots(astrologerId?: string | number) {
  return useQuery({
    queryKey: ["consultant", "slots", astrologerId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.BOOK_CONSULTANT.SLOTS, {
        params: astrologerId ? { astrologerId } : undefined,
      });
      return data.data;
    },
    enabled: !!astrologerId,
    staleTime: 0,
  });
}

export function useConsultantDurations() {
  return useQuery({
    queryKey: ["consultant", "durations"],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.BOOK_CONSULTANT.DURATIONS.LIST);
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBookConsultant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      astrologerId: string | number;
      serviceId: string | number;
      slotId: string | number;
      [key: string]: any;
    }) => {
      const { data } = await api.post(ENDPOINTS.BOOK_CONSULTANT.BOOK, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consultant", "slots"] });
      toast.success("Consultation booked!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to book consultation");
    },
  });
}
