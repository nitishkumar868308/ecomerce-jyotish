import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/user";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  // True once zustand has rehydrated from localStorage. Guards that run
  // before hydration would flash "unauthorized" even for logged-in users.
  hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      hasHydrated: false,
      setAuth: (user, token) => {
        localStorage.setItem("token", token);
        set({ user, token, isLoggedIn: true });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem("token");
        set({ user: null, token: null, isLoggedIn: false });
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
