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

/**
 * Fetch one astrologer with every nested relation (profile, services,
 * documents, extraDocuments, penalties). Used by the admin detail page
 * so every section can render without a waterfall of follow-up calls.
 */
export function useAdminAstrologer(id: number | string | null) {
  return useQuery({
    queryKey: ["admin", "astrologer", id],
    enabled: id != null && id !== "",
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Record<string, any>>>(
        ENDPOINTS.JYOTISH.ASTROLOGER.LIST,
        { params: { id } },
      );
      return data?.data ?? null;
    },
  });
}

/**
 * Generic update for the admin detail page — the backend exposes a
 * single `PUT /jyotish/astrologer` that accepts the full UpdateAstrologerDto
 * shape, so we funnel every edit (approve/reject/active toggle, revenue
 * split, profile fields, services, penalties, extra docs) through here.
 */
export function useUpdateAstrologer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any> & { id: number }) => {
      const { data } = await api.put<ApiResponse<Record<string, any>>>(
        ENDPOINTS.JYOTISH.ASTROLOGER.LIST,
        payload,
      );
      return data;
    },
    onSuccess: async (_res, vars) => {
      await Promise.all([
        qc.refetchQueries({ queryKey: ["admin", "astrologers"] }),
        qc.refetchQueries({ queryKey: ["admin", "astrologer", vars.id] }),
      ]);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update astrologer",
      );
    },
  });
}

/**
 * Uniqueness probe for the editable Display Name field. Backend rejects
 * clashing names on save anyway, but an inline check-as-you-type keeps
 * the form from letting the admin save a dud.
 */
export function useCheckAstrologerDisplayName(
  displayName: string,
  selfId?: number,
) {
  const trimmed = displayName.trim();
  return useQuery({
    queryKey: ["admin", "astrologer", "check-display-name", trimmed, selfId],
    enabled: trimmed.length >= 2,
    staleTime: 10 * 1000,
    queryFn: async () => {
      const { data } = await api.get<
        ApiResponse<{ available: boolean; selfHit?: boolean }>
      >("/jyotish/check-display-name", {
        params: { displayName: trimmed, ignoreId: selfId },
      });
      return data?.data ?? { available: false };
    },
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

export interface AdCampaignPayload {
  title: string;
  price: number;
  capacity: number;
  active?: boolean;
}

export function useCreateAdCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AdCampaignPayload) => {
      const { data } = await api.post<ApiResponse<AdCampaign>>(ENDPOINTS.JYOTISH.AD_CAMPAIGN.CREATE, payload);
      return data;
    },
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: ["admin", "adCampaigns"] });
      toast.success("Ad campaign created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create ad campaign");
    },
  });
}

export function useUpdateAdCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: AdCampaignPayload & { id: number }) => {
      const { data } = await api.put<ApiResponse<AdCampaign>>(ENDPOINTS.JYOTISH.AD_CAMPAIGN.UPDATE(id), payload);
      return data;
    },
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: ["admin", "adCampaigns"] });
      toast.success("Ad campaign updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update ad campaign");
    },
  });
}

export function useDeleteAdCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.JYOTISH.AD_CAMPAIGN.UPDATE(id));
    },
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: ["admin", "adCampaigns"] });
      toast.success("Ad campaign deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete ad campaign");
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
      // Backend's `fulfill` endpoint: APPROVED status triggers the
      // auto-apply logic (writes the requested value to the astrologer
      // record + flips row to FULFILLED). See profile-edit.service.ts.
      const { data } = await api.put(
        ENDPOINTS.JYOTISH.PROFILE_EDIT.FULFILL(id),
        { overallStatus: "APPROVED" },
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "profileEditRequests"] });
      qc.invalidateQueries({ queryKey: ["admin", "astrologers"] });
      toast.success("Profile edit approved and applied!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to approve profile edit");
    },
  });
}

export function useRejectProfileEdit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      reviewNote,
    }: {
      id: number;
      reviewNote?: string;
    }) => {
      const { data } = await api.put(
        ENDPOINTS.JYOTISH.PROFILE_EDIT.FULFILL(id),
        { overallStatus: "REJECTED", adminNote: reviewNote },
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "profileEditRequests"] });
      toast.success("Profile edit rejected.");
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
