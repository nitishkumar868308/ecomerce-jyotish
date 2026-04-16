import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Banner, HeaderItem, VideoStory } from "@/types/banner";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

// --- Banners ---

export function useAdminBanners() {
  return useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Banner[]>>(ENDPOINTS.BANNERS.LIST);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData) => {
      const { data } = await api.post(ENDPOINTS.BANNERS.CREATE, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner created!");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed to create banner"),
  });
}

export function useAdminDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.BANNERS.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner deleted!");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed to delete banner"),
  });
}

// --- Headers ---

export function useAdminHeaders() {
  return useQuery({
    queryKey: ["admin", "headers"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<HeaderItem[]>>(ENDPOINTS.HEADERS.LIST);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminCreateHeader() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData | Partial<HeaderItem>) => {
      const { data } = await api.post(ENDPOINTS.HEADERS.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "headers"] });
      qc.invalidateQueries({ queryKey: ["headers"] });
      toast.success("Header created!");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed to create header"),
  });
}

export function useAdminDeleteHeader() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.HEADERS.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "headers"] });
      qc.invalidateQueries({ queryKey: ["headers"] });
      toast.success("Header deleted!");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed to delete header"),
  });
}

// --- Video Stories ---

export function useAdminVideoStories() {
  return useQuery({
    queryKey: ["admin", "videoStories"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<VideoStory[]>>(ENDPOINTS.VIDEO_STORY.LIST);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminCreateVideoStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData | Partial<VideoStory>) => {
      const { data } = await api.post(ENDPOINTS.VIDEO_STORY.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "videoStories"] });
      qc.invalidateQueries({ queryKey: ["videoStories"] });
      toast.success("Video story created!");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed to create video story"),
  });
}

export function useAdminDeleteVideoStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.VIDEO_STORY.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "videoStories"] });
      qc.invalidateQueries({ queryKey: ["videoStories"] });
      toast.success("Video story deleted!");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed to delete video story"),
  });
}
