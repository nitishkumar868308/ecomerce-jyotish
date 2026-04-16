import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Review } from "@/types/review";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/api";
import toast from "react-hot-toast";

export function useReviews(params?: PaginationParams & { productId?: number }) {
  return useQuery({
    queryKey: ["reviews", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Review>>(ENDPOINTS.REVIEWS.LIST, { params });
      return data;
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Review>) => {
      const { data } = await api.post(ENDPOINTS.REVIEWS.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review submitted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed");
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.REVIEWS.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed");
    },
  });
}
