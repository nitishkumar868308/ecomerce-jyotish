import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import toast from "react-hot-toast";

/* ───────── Legacy (admin slot templates) ───────── */

export function useMyAdCampaigns() {
  return useQuery({
    queryKey: ["jyotish", "adCampaigns"],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.AD_CAMPAIGN.LIST);
      return data.data;
    },
    staleTime: 0,
  });
}

export function useCreateAdCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { [key: string]: any }) => {
      const { data } = await api.post(
        ENDPOINTS.JYOTISH.AD_CAMPAIGN.CREATE,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jyotish", "adCampaigns"] });
      toast.success("Ad campaign created!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create ad campaign",
      );
    },
  });
}

/**
 * Active AdCampaign templates surfaced to the astrologer. Each row is
 * an admin-defined "campaign" (title + price + capacity) the
 * astrologer can pick from before opening the calendar. Returns an
 * empty list when admin hasn't published any active campaigns yet,
 * which the UI renders as an explicit empty state.
 */
export interface AdCampaignEntry {
  id: number;
  title: string;
  price: number;
  capacity: number;
  active: boolean;
  createdAt?: string;
}

export function useActiveAdCampaigns() {
  return useQuery({
    queryKey: ["jyotish", "ad-campaigns", "active"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data } = await api.get<{ data: AdCampaignEntry[] }>(
        "/jyotish/ad-campaign/active",
      );
      return data.data ?? [];
    },
  });
}

/* ───────── Per-day booking (astrologer buys N days) ─────────
 *
 * Backend routes (already exist in ad-campaign.controller.ts):
 *   GET  /jyotish/ad-campaign/availability?startDate&endDate
 *   POST /jyotish/ad-campaign/book  { astrologerId, dates[] }
 *   GET  /jyotish/ad-campaign/my-bookings?astrologerId
 *   GET  /admin/ad-campaign/bookings              (admin)
 *   GET  /admin/ad-campaign/config                (admin — pricePerDay)
 */

export interface AdAvailabilityDay {
  date: string;
  booked: number;
  available: number;
}

export interface AdCampaignConfig {
  capacityPerDay: number;
  pricePerDay: number;
  currency: string;
  currencySymbol: string;
}

export function useAdAvailability(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["jyotish", "ad-availability", startDate, endDate],
    enabled: !!startDate && !!endDate,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data } = await api.get<{
        data: { config: AdCampaignConfig; availability: AdAvailabilityDay[] };
      }>("/jyotish/ad-campaign/availability", {
        params: { startDate, endDate },
      });
      return data.data;
    },
  });
}

export function useMyAdBookings(astrologerId: number | string | undefined) {
  return useQuery({
    queryKey: ["jyotish", "my-ad-bookings", astrologerId],
    enabled: !!astrologerId,
    queryFn: async () => {
      const { data } = await api.get<{ data: any[] }>(
        "/jyotish/ad-campaign/my-bookings",
        { params: { astrologerId } },
      );
      return data.data ?? [];
    },
  });
}

export function useBookAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      astrologerId: number | string;
      dates: string[];
      /** Selected AdCampaign row id — backend bills its price × days. */
      campaignId?: number | null;
    }) => {
      const { data } = await api.post("/jyotish/ad-campaign/book", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jyotish", "ad-availability"] });
      qc.invalidateQueries({ queryKey: ["jyotish", "my-ad-bookings"] });
      qc.invalidateQueries({ queryKey: ["admin", "ad-bookings"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Could not book these dates.",
      );
    },
  });
}

/* ───────── Admin-side helpers ───────── */

export function useAdminAllAdBookings() {
  return useQuery({
    queryKey: ["admin", "ad-bookings"],
    queryFn: async () => {
      const { data } = await api.get<{ data: any[] }>(
        "/admin/ad-campaign/bookings",
      );
      return data.data ?? [];
    },
  });
}

export function useAdminAdConfig() {
  return useQuery({
    queryKey: ["admin", "ad-config"],
    queryFn: async () => {
      const { data } = await api.get<{ data: AdCampaignConfig }>(
        "/admin/ad-campaign/config",
      );
      return data.data;
    },
  });
}
