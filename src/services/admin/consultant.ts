"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, ENDPOINTS } from "@/lib/api";

// ---------- Types ----------

export interface ConsultantService {
  id: number;
  title: string;
  shortDesc?: string;
  longDesc?: string;
  image?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConsultantDuration {
  id: number;
  minutes: number;
  label: string;
  price: number;
}

export interface ServicePayload {
  title: string;
  shortDesc?: string;
  longDesc?: string;
  image?: string;
  active: boolean;
}

export interface DurationPayload {
  minutes: number;
  label: string;
  price: number;
}

// ---------- Services ----------

const serviceKey = ["admin", "consultant", "services"] as const;

export function useAdminConsultantServices() {
  return useQuery({
    queryKey: serviceKey,
    queryFn: async (): Promise<ConsultantService[]> => {
      const { data } = await api.get(ENDPOINTS.BOOK_CONSULTANT.SERVICES.LIST);
      return data?.data ?? data ?? [];
    },
  });
}

export function useCreateConsultantService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ServicePayload) => {
      const { data } = await api.post(
        ENDPOINTS.BOOK_CONSULTANT.SERVICES.CREATE,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKey });
      qc.invalidateQueries({ queryKey: ["consultant", "services"] });
      toast.success("Service created");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Create failed";
      toast.error(msg);
    },
  });
}

export function useUpdateConsultantService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<ServicePayload>;
    }) => {
      const { data } = await api.put(
        ENDPOINTS.BOOK_CONSULTANT.SERVICES.UPDATE(id),
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKey });
      qc.invalidateQueries({ queryKey: ["consultant", "services"] });
      toast.success("Service updated");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast.error(msg);
    },
  });
}

export function useDeleteConsultantService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(
        ENDPOINTS.BOOK_CONSULTANT.SERVICES.DELETE(id),
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKey });
      qc.invalidateQueries({ queryKey: ["consultant", "services"] });
      toast.success("Service deleted");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error(msg);
    },
  });
}

// ---------- Durations ----------

const durationKey = ["admin", "consultant", "durations"] as const;

export function useAdminConsultantDurations() {
  return useQuery({
    queryKey: durationKey,
    queryFn: async (): Promise<ConsultantDuration[]> => {
      const { data } = await api.get(
        ENDPOINTS.BOOK_CONSULTANT.DURATIONS.LIST,
      );
      return data?.data ?? data ?? [];
    },
  });
}

export function useCreateConsultantDuration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DurationPayload) => {
      const { data } = await api.post(
        ENDPOINTS.BOOK_CONSULTANT.DURATIONS.CREATE,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: durationKey });
      qc.invalidateQueries({ queryKey: ["consultant", "durations"] });
      toast.success("Duration created");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Create failed";
      toast.error(msg);
    },
  });
}

export function useUpdateConsultantDuration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<DurationPayload>;
    }) => {
      const { data } = await api.put(
        ENDPOINTS.BOOK_CONSULTANT.DURATIONS.UPDATE(id),
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: durationKey });
      qc.invalidateQueries({ queryKey: ["consultant", "durations"] });
      toast.success("Duration updated");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast.error(msg);
    },
  });
}

export function useDeleteConsultantDuration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(
        ENDPOINTS.BOOK_CONSULTANT.DURATIONS.DELETE(id),
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: durationKey });
      qc.invalidateQueries({ queryKey: ["consultant", "durations"] });
      toast.success("Duration deleted");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error(msg);
    },
  });
}
