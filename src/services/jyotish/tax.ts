"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { JyotishTaxConfig } from "@/types/jyotish";

export const jyotishTaxQueryKey = ["jyotish", "taxConfig"] as const;

export function useJyotishTaxConfig() {
  return useQuery({
    queryKey: jyotishTaxQueryKey,
    queryFn: async (): Promise<JyotishTaxConfig> => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.TAX_CONFIG.GET);
      return data?.data ?? data;
    },
  });
}

export interface UpdateJyotishTaxPayload {
  gstPercent: number;
}

export function useUpdateJyotishTaxConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateJyotishTaxPayload) => {
      const { data } = await api.put(ENDPOINTS.JYOTISH.TAX_CONFIG.UPDATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jyotishTaxQueryKey });
    },
  });
}
