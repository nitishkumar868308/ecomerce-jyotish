import { create } from "zustand";
import { persist } from "zustand/middleware";

interface QuickGoState {
  /** City name picked on the QuickGo landing modal (from the Location master). */
  city: string | null;
  /** Matching StateCountry id from the Location master row. */
  cityRefId: number | null;
  /** State name for display (denormalised). */
  state: string | null;
  /** Pincode chosen from the available warehouses in that city. */
  pincode: string | null;
  hasHydrated: boolean;

  // --- Modal control (ephemeral, NOT persisted) ---
  /** Whether the landing modal is open via an explicit user action (e.g. topbar). */
  modalOpen: boolean;
  /**
   * City name to preselect when the modal opens — used by the topbar city
   * picker so the shopper only needs to choose a pincode.
   */
  preselectCity: string | null;

  setLocation: (p: {
    city: string;
    cityRefId: number | null;
    state: string;
    pincode: string;
  }) => void;
  clear: () => void;
  setHasHydrated: (v: boolean) => void;
  openModal: (preselectCity?: string | null) => void;
  closeModal: () => void;
}

export const useQuickGoStore = create<QuickGoState>()(
  persist(
    (set) => ({
      city: null,
      cityRefId: null,
      state: null,
      pincode: null,
      hasHydrated: false,
      modalOpen: false,
      preselectCity: null,
      setLocation: ({ city, cityRefId, state, pincode }) =>
        set({
          city,
          cityRefId,
          state,
          pincode,
          modalOpen: false,
          preselectCity: null,
        }),
      clear: () =>
        set({
          city: null,
          cityRefId: null,
          state: null,
          pincode: null,
        }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
      openModal: (preselectCity = null) =>
        set({ modalOpen: true, preselectCity }),
      closeModal: () => set({ modalOpen: false, preselectCity: null }),
    }),
    {
      name: "quickgo-location",
      partialize: (s) => ({
        city: s.city,
        cityRefId: s.cityRefId,
        state: s.state,
        pincode: s.pincode,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
