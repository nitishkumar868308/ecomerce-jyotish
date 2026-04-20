import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { CartItem, AddToCartPayload } from "@/types/cart";
import type { ApiResponse } from "@/types/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { apiError, apiSuccess } from "@/lib/apiMessage";
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

/**
 * Infer which storefront this cart-add came from, based on where the user is
 * when clicking "Add to cart". Callers can override by setting `purchasePlatform`
 * explicitly on the payload.
 */
function inferPurchasePlatform(): string {
  if (typeof window === "undefined") return "wizard";
  const path = window.location.pathname;
  if (path.startsWith("/hecate-quickgo")) return "quickgo";
  return "wizard";
}

export function useAddToCart() {
  const qc = useQueryClient();
  const { isLoggedIn } = useAuthStore();
  return useMutation({
    mutationFn: async (payload: AddToCartPayload) => {
      if (!isLoggedIn) {
        throw new Error("LOGIN_REQUIRED");
      }
      const withPlatform: AddToCartPayload = {
        ...payload,
        purchasePlatform: payload.purchasePlatform || inferPurchasePlatform(),
      };
      const { data } = await api.post(ENDPOINTS.CART.ADD, withPlatform);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success(apiSuccess(data, "Added to cart"));
    },
    onError: (error: any) => {
      if (error.message === "LOGIN_REQUIRED") {
        toast.error("Please login to add items to cart");
        return;
      }
      toast.error(apiError(error));
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { data } = await api.put(ENDPOINTS.CART.UPDATE, { id, quantity });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: any) => toast.error(apiError(error)),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(ENDPOINTS.CART.DELETE, { data: { id } });
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success(apiSuccess(data, "Removed from cart"));
    },
    onError: (error: any) => toast.error(apiError(error)),
  });
}
