"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import { useWalletBalance } from "@/services/wallet";
import { useStartChatSession } from "@/services/jyotish/sessions";

type Medium = "chat" | "call";

/** Minimum rupees we require in the wallet before a consultation can
 *  start. Picked so a shopper always has a safety buffer — we only go
 *  per-minute-rate based when the astrologer has set one. */
const MIN_WALLET_ABSOLUTE = 50;

/**
 * Shared "launch a consultation" handler wired to Chat / Call buttons
 * on astrologer cards + the profile page. Replaces the old
 * `BookingModal` — no modal, direct ring.
 *
 * Guards run in this order, each blocking:
 *   1. Logged in?       → else open the auth modal
 *   2. Self-booking?    → astrologer can't book themselves
 *   3. Astrologer live? → else tell the shopper they're offline, bail
 *   4. Wallet funded?   → need ≥ max(MIN_WALLET_ABSOLUTE, 3 × rate)
 *
 * After the gates, POST /jyotish/chat/start-session creates a PENDING
 * session; the server notifies the astrologer, we route the shopper to
 * /jyotish/chat/[sessionId] which polls until the status flips to
 * ACTIVE. Per-minute billing is enforced server-side.
 */
export function useConsultationLauncher() {
  const router = useRouter();
  const openModal = useUIStore((s) => s.openModal);
  const openConnecting = useUIStore((s) => s.openConnecting);
  const { isLoggedIn, user } = useAuthStore();
  const { data: walletData } = useWalletBalance();
  const startSession = useStartChatSession();

  const walletBalance = Number(
    (walletData as { balance?: number | string } | undefined)?.balance ?? 0,
  );

  const launch = (astrologer: any, medium: Medium) => {
    // ── Gate 1: login
    if (!isLoggedIn || !user) {
      toast("Sign in to start a consultation", { icon: "🔐" });
      openModal("auth");
      return;
    }

    // ── Gate 2: self-booking guard — an astrologer logged in via the
    //    same auth store can't start a chat with their own profile.
    //    Everyone else (regular shoppers + astrologers visiting
    //    someone else's page) passes.
    const astrologerId = astrologer?.id ?? astrologer?._id;
    if (
      (user as { id?: number | string }).id != null &&
      astrologerId != null &&
      String((user as { id?: number | string }).id) === String(astrologerId) &&
      String((user as { role?: string }).role ?? "").toUpperCase() ===
        "ASTROLOGER"
    ) {
      toast.error("You can't book a consultation with yourself.");
      return;
    }

    // ── Gate 3: astrologer availability. When offline we tell the
    //    shopper up-front instead of creating a silent pending session
    //    that will never get picked up.
    if (!astrologer?.isOnline) {
      toast.error(
        "This astrologer is offline right now. Please try again when they're live.",
      );
      return;
    }

    // ── Gate 3b: busy guard. The astrologer is online but already on
    //    another consultation — the server would reject anyway, but
    //    catching it client-side avoids the toast-after-spinner flicker.
    if (astrologer?.isBusy) {
      toast.error(
        "This astrologer is in another consultation right now. Please try again in a few minutes.",
      );
      return;
    }

    // ── Gate 4: wallet. Require both an absolute floor AND a per-
    //    minute-rate safety so the session doesn't auto-end on the
    //    first tick.
    const ratePerMin = Number(
      astrologer?.pricePerMinute ??
        astrologer?.pricePerMin ??
        astrologer?.services?.[0]?.price ??
        0,
    );
    const minRequired = Math.max(MIN_WALLET_ABSOLUTE, ratePerMin * 3);
    if (walletBalance < minRequired) {
      toast.error(
        `Wallet balance ₹${walletBalance.toLocaleString(
          "en-IN",
        )} is too low. Add at least ₹${minRequired.toLocaleString("en-IN")} to start.`,
      );
      router.push("/dashboard/wallet/add-money");
      return;
    }

    const userId = (user as { id?: number | string }).id;
    startSession.mutate(
      { userId, astrologerId, type: medium },
      {
        onSuccess: (data: any) => {
          const sessionId =
            data?.data?.id ?? data?.data?._id ?? data?.id ?? data?._id;
          if (!sessionId) return;
          // Hand off to the global "Connecting…" modal instead of
          // navigating immediately — we only route into the chat room
          // after the astrologer flips the session to ACTIVE.
          openConnecting({
            sessionId,
            astrologerName:
              astrologer?.displayName ??
              astrologer?.fullName ??
              astrologer?.name,
            astrologerImage: astrologer?.profile?.image ?? astrologer?.avatar,
            medium,
          });
        },
      },
    );
  };

  return {
    launch,
    isPending: startSession.isPending,
    walletBalance,
  };
}
