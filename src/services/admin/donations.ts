import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/api";
import toast from "react-hot-toast";

/** A donor record — the actual donations received from users. */
export interface Donation {
  id: number;
  name: string;
  donorName?: string;
  email?: string;
  phone?: string;
  amount: number;
  currency: string;
  countryCode: string;
  message?: string;
  campaignId?: number;
  campaignTitle?: string;
  paymentStatus?: string;
  status?: string;
  createdAt: string;
}

/** A donation cause / campaign — what donors are donating toward. */
export interface DonationCampaign {
  id: number;
  title: string;
  description?: string;
  image?: string;
  targetAmount?: number;
  raisedAmount?: number;
  currency?: string;
  countryCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export function useDonations(params?: PaginationParams) {
  return useQuery({
    queryKey: ["admin", "donations", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Donation> | ApiResponse<Donation[]>>(
        ENDPOINTS.DONATIONS.LIST,
        { params },
      );
      // Support both paginated and flat responses.
      if ("totalPages" in data) return data as PaginatedResponse<Donation>;
      const flat = (data as ApiResponse<Donation[]>).data ?? [];
      return {
        success: true,
        data: flat,
        total: flat.length,
        page: 1,
        limit: flat.length || 20,
        totalPages: 1,
      } as PaginatedResponse<Donation>;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Donation>) => {
      const { data } = await api.post<ApiResponse<Donation>>(ENDPOINTS.DONATIONS.CREATE, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "donations"] });
      toast.success("Donation recorded!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to record donation");
    },
  });
}

export function useUpdateDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Donation> & { id: number }) => {
      const { data } = await api.put<ApiResponse<Donation>>(ENDPOINTS.DONATIONS.UPDATE(id), payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "donations"] });
      toast.success("Donation updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update donation");
    },
  });
}

export function useDeleteDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.DONATIONS.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "donations"] });
      toast.success("Donation deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete donation");
    },
  });
}

// ── Campaigns ───────────────────────────────────────────────
export function useDonationCampaigns(params?: PaginationParams) {
  return useQuery({
    queryKey: ["admin", "donationCampaigns", params],
    queryFn: async () => {
      const { data } = await api.get<
        PaginatedResponse<DonationCampaign> | ApiResponse<DonationCampaign[]>
      >(ENDPOINTS.DONATIONS.CAMPAIGNS, { params });
      if ("totalPages" in data) return data as PaginatedResponse<DonationCampaign>;
      const flat = (data as ApiResponse<DonationCampaign[]>).data ?? [];
      return {
        success: true,
        data: flat,
        total: flat.length,
        page: 1,
        limit: flat.length || 20,
        totalPages: 1,
      } as PaginatedResponse<DonationCampaign>;
    },
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useCreateDonationCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DonationCampaign>) => {
      const { data } = await api.post<ApiResponse<DonationCampaign>>(
        ENDPOINTS.DONATIONS.CAMPAIGNS,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "donationCampaigns"] });
      toast.success("Campaign created!");
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || "Failed to create campaign"),
  });
}

export function useUpdateDonationCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<DonationCampaign> & { id: number }) => {
      const { data } = await api.put<ApiResponse<DonationCampaign>>(
        ENDPOINTS.DONATIONS.CAMPAIGN(id),
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "donationCampaigns"] });
      toast.success("Campaign updated!");
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || "Failed to update campaign"),
  });
}

export function useDeleteDonationCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.DONATIONS.CAMPAIGN(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "donationCampaigns"] });
      toast.success("Campaign deleted!");
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || "Failed to delete campaign"),
  });
}
