import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Review } from "@/types/review";
import type { PaginatedResponse, PaginationParams } from "@/types/api";
import toast from "react-hot-toast";

export function useAdminReviews(params?: PaginationParams & { productId?: number }) {
  return useQuery({
    queryKey: ["admin", "reviews", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Review>>(ENDPOINTS.REVIEWS.LIST, {
        params,
      });
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.REVIEWS.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete review");
    },
  });
}
