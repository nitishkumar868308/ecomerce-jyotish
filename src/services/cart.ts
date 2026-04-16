import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { CartItem, AddToCartPayload } from "@/types/cart";
import type { ApiResponse } from "@/types/api";
import { useAuthStore } from "@/stores/useAuthStore";
import toast from "react-hot-toast";

export function useCart() {
  const { isLoggedIn } = useAuthStore();
  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CartItem[]>>(ENDPOINTS.CART.LIST);
      return data.data;
    },
    enabled: isLoggedIn,
    staleTime: 0,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddToCartPayload) => {
      const { data } = await api.post(ENDPOINTS.CART.ADD, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add to cart");
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const { data } = await api.put(ENDPOINTS.CART.UPDATE(id), { quantity });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed");
    },
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.CART.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Removed from cart");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed");
    },
  });
}
