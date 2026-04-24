import { create } from "zustand";

// Snapshot passed into the "Connecting to astrologer…" modal. The
// modal itself polls the session by id — the astrologer name and
// medium just let us show a nice card while we wait for the backend to
// flip the status to ACTIVE.
export interface ConnectingContext {
  sessionId: number | string;
  astrologerName?: string;
  astrologerImage?: string;
  medium?: "chat" | "call";
}

interface UIState {
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  searchOpen: boolean;
  activeModal: string | null;
  connecting: ConnectingContext | null;
  /** Optional global "transition" message. When set, layouts render a
   *  full-page Loader overlay — used to bridge the slow moment between
   *  an accept/end click and the next page mounting, so the user isn't
   *  staring at a frozen screen wondering if anything happened. */
  transitionMessage: string | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  openConnecting: (ctx: ConnectingContext) => void;
  closeConnecting: () => void;
  startTransition: (message: string) => void;
  endTransition: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarCollapsed: false,
  sidebarOpen: false,
  mobileMenuOpen: false,
  searchOpen: false,
  activeModal: null,
  connecting: null,
  transitionMessage: null,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
  openConnecting: (ctx) => set({ connecting: ctx }),
  closeConnecting: () => set({ connecting: null }),
  startTransition: (message) => set({ transitionMessage: message }),
  endTransition: () => set({ transitionMessage: null }),
}));
