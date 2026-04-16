import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocalCartItem {
  productId: number;
  variationId?: number;
  quantity: number;
}

interface CartState {
  items: LocalCartItem[];
  isOpen: boolean;
  addItem: (item: LocalCartItem) => void;
  removeItem: (productId: number, variationId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variationId?: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.variationId === item.variationId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.variationId === item.variationId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (productId, variationId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variationId === variationId)
          ),
        })),
      updateQuantity: (productId, quantity, variationId) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variationId === variationId
              ? { ...i, quantity }
              : i
          ),
        })),
      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setCartOpen: (open) => set({ isOpen: open }),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
