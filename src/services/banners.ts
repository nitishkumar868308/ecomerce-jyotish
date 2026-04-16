import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Banner, HeaderItem, VideoStory } from "@/types/banner";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

export function useBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Banner[]>>(ENDPOINTS.BANNERS.LIST);
      return data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData) => {
      const { data } = await api.post(ENDPOINTS.BANNERS.CREATE, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner created!");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed"),
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => { await api.delete(ENDPOINTS.BANNERS.DELETE(id)); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner deleted!");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed"),
  });
}

export function useHeaders() {
  return useQuery({
    queryKey: ["headers"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<HeaderItem[]>>(ENDPOINTS.HEADERS.LIST);
      return data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateHeader() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData | Partial<HeaderItem>) => {
      const { data } = await api.post(ENDPOINTS.HEADERS.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["headers"] });
      toast.success("Header created!");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed"),
  });
}

export function useDeleteHeader() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => { await api.delete(ENDPOINTS.HEADERS.DELETE(id)); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["headers"] });
      toast.success("Header deleted!");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed"),
  });
}

export function useVideoStories() {
  return useQuery({
    queryKey: ["videoStories"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<VideoStory[]>>(ENDPOINTS.VIDEO_STORY.LIST);
      return data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateVideoStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData | Partial<VideoStory>) => {
      const { data } = await api.post(ENDPOINTS.VIDEO_STORY.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videoStories"] });
      toast.success("Video story created!");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed"),
  });
}

export function useDeleteVideoStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => { await api.delete(ENDPOINTS.VIDEO_STORY.DELETE(id)); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videoStories"] });
      toast.success("Video story deleted!");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed"),
  });
}
