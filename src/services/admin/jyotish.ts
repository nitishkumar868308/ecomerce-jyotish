import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Astrologer, AdCampaign, ProfileEditRequest, FreeConsultationOffer } from "@/types/jyotish";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/api";
import toast from "react-hot-toast";

// --- Astrologers ---

export function useAdminAstrologers(params?: PaginationParams) {
  return useQuery({
    queryKey: ["admin", "astrologers", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Astrologer>>(ENDPOINTS.JYOTISH.ASTROLOGER.LIST, {
        params,
      });
      return data;
    },
    staleTime: 60 * 1000,
  });
}

// --- Ad Campaigns ---

export function useAdminAdCampaigns(params?: PaginationParams) {
  return useQuery({
    queryKey: ["admin", "adCampaigns", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AdCampaign>>(ENDPOINTS.JYOTISH.AD_CAMPAIGN.LIST, {
        params,
      });
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateAdCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<AdCampaign>) => {
      const { data } = await api.post<ApiResponse<AdCampaign>>(ENDPOINTS.JYOTISH.AD_CAMPAIGN.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "adCampaigns"] });
      toast.success("Ad campaign created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create ad campaign");
    },
  });
}

// --- Profile Edit Requests ---

export function useAdminProfileEditRequests(params?: PaginationParams) {
  return useQuery({
    queryKey: ["admin", "profileEditRequests", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ProfileEditRequest>>(ENDPOINTS.JYOTISH.PROFILE_EDIT.LIST, {
        params,
      });
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useApproveProfileEdit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.put(ENDPOINTS.JYOTISH.PROFILE_EDIT.APPROVE(id));
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "profileEditRequests"] });
      qc.invalidateQueries({ queryKey: ["admin", "astrologers"] });
      toast.success("Profile edit approved!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to approve profile edit");
    },
  });
}

export function useRejectProfileEdit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reviewNote }: { id: number; reviewNote?: string }) => {
      const { data } = await api.put(ENDPOINTS.JYOTISH.PROFILE_EDIT.REJECT(id), { reviewNote });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "profileEditRequests"] });
      toast.success("Profile edit rejected!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reject profile edit");
    },
  });
}

export interface ApproveAstrologerPayload {
  id: string | number;
  commissionPercent: number;
}

export function useApproveAstrologer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, commissionPercent }: ApproveAstrologerPayload) => {
      const { data } = await api.put(ENDPOINTS.JYOTISH.ASTROLOGER.APPROVE(id), {
        commissionPercent,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "astrologers"] });
    },
  });
}

export interface RejectAstrologerPayload {
  id: string | number;
  rejectionReason: string;
}

export function useRejectAstrologer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rejectionReason }: RejectAstrologerPayload) => {
      const { data } = await api.put(ENDPOINTS.JYOTISH.ASTROLOGER.REJECT(id), {
        rejectionReason,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "astrologers"] });
    },
  });
}

export interface SetCommissionPayload {
  id: string | number;
  commissionPercent: number;
}

export function useSetAstrologerCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, commissionPercent }: SetCommissionPayload) => {
      const { data } = await api.put(ENDPOINTS.JYOTISH.ASTROLOGER.SET_COMMISSION(id), {
        commissionPercent,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "astrologers"] });
    },
  });
}

// --- Free Consultation Offers ---

export interface FreeOfferPayload {
  astrologerId: number;
  title: string;
  description?: string;
  astrologerAmount: number;
  adminAmount: number;
  sessionsCap: number;
  startDate?: string;
  endDate?: string;
  active: boolean;
}

const freeOffersKey = ["admin", "freeOffers"] as const;

export function useAdminFreeOffers() {
  return useQuery({
    queryKey: freeOffersKey,
    queryFn: async (): Promise<FreeConsultationOffer[]> => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.FREE_OFFERS.LIST);
      return data?.data ?? data ?? [];
    },
  });
}

export function useCreateFreeOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FreeOfferPayload) => {
      const { data } = await api.post(ENDPOINTS.JYOTISH.FREE_OFFERS.CREATE, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: freeOffersKey }),
  });
}

export function useUpdateFreeOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<FreeOfferPayload> }) => {
      const { data } = await api.put(ENDPOINTS.JYOTISH.FREE_OFFERS.UPDATE(id), payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: freeOffersKey }),
  });
}

export function useDeleteFreeOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(ENDPOINTS.JYOTISH.FREE_OFFERS.DELETE(id));
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: freeOffersKey }),
  });
}
