import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { AddToCartPayload, CartResponse } from "@/types/cart";
import type { ApiResponse } from "@/types/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { apiError, apiSuccess } from "@/lib/apiMessage";
import toast from "react-hot-toast";

const EMPTY_CART: CartResponse = {
  items: [],
  groups: [],
  summary: {
    subtotal: 0,
    discount: 0,
    total: 0,
    currency: "INR",
    currencySymbol: "₹",
    itemCount: 0,
  },
};

/**
 * Fetches the user's cart with server-computed offer/bulk/currency applied.
 * Backend is the single source of truth for pricing — we never recompute
 * client-side. The cart query re-runs whenever auth state changes so
 * logging out clears the view and logging in shows the stored cart.
 */
export function useCart() {
  const { isLoggedIn, user } = useAuthStore();
  return useQuery<CartResponse>({
    queryKey: ["cart", user?.id ?? null],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CartResponse>>(
        ENDPOINTS.CART.LIST,
        user?.id ? { params: { userId: user.id } } : undefined,
      );
      return data.data ?? EMPTY_CART;
    },
    enabled: isLoggedIn,
    staleTime: 0,
    placeholderData: EMPTY_CART,
  });
}

/**
 * Admin-only lookup of another user's live cart. Uses the existing
 * public `GET /cart?userId=` endpoint so server-side pricing + offer +
 * bulk logic all flow through unchanged. Fetch is gated on `enabled`
 * so opening a non-cart admin modal doesn't spam the endpoint.
 */
export function useUserCart(userId: number | null | undefined, enabled = true) {
  return useQuery<CartResponse>({
    queryKey: ["cart", "admin-view", userId ?? null],
    queryFn: async () => {
      if (!userId) return EMPTY_CART;
      const { data } = await api.get<ApiResponse<CartResponse>>(
        ENDPOINTS.CART.LIST,
        { params: { userId } },
      );
      return data.data ?? EMPTY_CART;
    },
    enabled: !!userId && enabled,
    staleTime: 30 * 1000,
    placeholderData: EMPTY_CART,
  });
}

function inferPurchasePlatform(): string {
  if (typeof window === "undefined") return "wizard";
  const path = window.location.pathname;
  if (path.startsWith("/hecate-quickgo")) return "quickgo";
  return "wizard";
}

export function useAddToCart() {
  const qc = useQueryClient();
  const { isLoggedIn, user } = useAuthStore();
  return useMutation({
    mutationFn: async (payload: AddToCartPayload) => {
      if (!isLoggedIn) throw new Error("LOGIN_REQUIRED");
      const withDefaults: AddToCartPayload = {
        ...payload,
        userId: payload.userId ?? user?.id,
        purchasePlatform: payload.purchasePlatform || inferPurchasePlatform(),
      };
      const { data } = await api.post(ENDPOINTS.CART.ADD, withDefaults);
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
    onError: (error: any) => toast.error(apiError(error)),
  });
}

/** Remove a single cart line (one variation row). */
export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(ENDPOINTS.CART.DELETE, {
        data: { id },
      });
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success(apiSuccess(data, "Removed from cart"));
    },
    onError: (error: any) => toast.error(apiError(error)),
  });
}

/**
 * Remove every variation row for a single product in the user's cart —
 * used when the shopper confirms the "Remove this product?" dialog (or
 * when removing the last variation surfaces the product-delete prompt).
 */
export function useRemoveProductFromCart() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user?.id) throw new Error("LOGIN_REQUIRED");
      const { data } = await api.delete(ENDPOINTS.CART.DELETE, {
        data: { productId, userId: user.id },
      });
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success(apiSuccess(data, "Product removed from cart"));
    },
    onError: (error: any) => toast.error(apiError(error)),
  });
}

/** Empty the user's cart entirely. Called from the "Remove All" dialog. */
export function useClearCart() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("LOGIN_REQUIRED");
      const { data } = await api.delete(ENDPOINTS.CART.DELETE, {
        data: { clearAll: true, userId: user.id },
      });
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success(apiSuccess(data, "Cart cleared"));
    },
    onError: (error: any) => toast.error(apiError(error)),
  });
}
