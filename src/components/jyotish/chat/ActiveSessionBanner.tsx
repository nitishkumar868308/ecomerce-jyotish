"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserActiveSession } from "@/services/jyotish/sessions";
import { resolveAssetUrl } from "@/lib/assetUrl";

/**
 * Floating "Return to chat" banner for shoppers.
 *
 * Scenario this solves: a shopper starts a paid consultation then
 * navigates away (accidentally taps back, opens the mall in a new
 * tab, home icon, wallet page etc.). Their session keeps ticking
 * server-side — they need an obvious way back in before the wallet
 * drains. This banner appears fixed at the bottom of any jyotish
 * page, shows the astrologer's name + an arrow to the chat room, and
 * only hides while they're already on that chat page.
 *
 * Polls `GET /jyotish/chat/user-active?userId=X` every 4s via the
 * hook. PENDING sessions also surface so the "connecting…" state
 * has a parallel fallback if the modal was dismissed by mistake.
 */
export function ActiveSessionBanner() {
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuthStore();

  // Shopper-only surface. Astrologer accounts never book consultations,
  // so this banner is irrelevant (and can be noisy) for them.
  const role = String(
    (user as { role?: string } | null)?.role ?? "USER",
  ).toUpperCase();
  const isShopper = isLoggedIn && role !== "ASTROLOGER";

  const { data: active } = useUserActiveSession(
    isShopper ? user?.id : undefined,
  );

  if (!active) return null;

  const sessionId = Number(active.id);
  const href = `/jyotish/chat/${sessionId}`;

  // Hide when the shopper is already inside the chat page — banner
  // would just be redundant chrome covering the composer.
  if (pathname?.startsWith(`/jyotish/chat/${sessionId}`)) return null;
  // Also hide during the initial connecting flow; the modal handles it.
  if (pathname === "/jyotish/consult-now" && active.status === "PENDING") {
    // still show — user might have scrolled past the modal — keep it
  }

  const astro = (active as any).astrologer ?? {};
  const name =
    astro.displayName ??
    astro.fullName ??
    astro.name ??
    "your astrologer";
  const imgRaw = astro.profile?.image ?? astro.profileImage ?? astro.avatar;
  const imgSrc = imgRaw ? resolveAssetUrl(imgRaw) || imgRaw : "";
  const statusLabel =
    active.status === "ACTIVE"
      ? "Session live"
      : active.status === "PAUSED"
        ? "Paused"
        : "Waiting to be accepted";

  return (
    <Link
      href={href}
      className="group fixed bottom-4 left-1/2 z-[70] flex w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 items-center gap-3 overflow-hidden rounded-2xl border border-[var(--jy-accent-gold)]/40 bg-gradient-to-br from-[#15102a]/95 via-[#0f0a24]/95 to-[#0b0719]/95 px-4 py-3 shadow-2xl shadow-[var(--jy-accent-gold)]/10 backdrop-blur-xl transition-transform hover:-translate-y-0.5 hover:-translate-x-1/2"
    >
      {/* Pulsing gold accent stripe grabs the eye on a busy page */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--jy-accent-gold)] to-transparent opacity-80" />

      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--jy-accent-gold)]/50 bg-[var(--jy-accent-purple)]/25">
        {imgSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={imgSrc} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--jy-accent-gold)]">
            <MessageCircle className="h-4 w-4" />
          </div>
        )}
        {active.status === "ACTIVE" && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-[#15102a] bg-emerald-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--jy-accent-gold)]">
          {statusLabel}
        </p>
        <p className="truncate text-sm font-semibold text-[var(--jy-text-primary)]">
          {name}
        </p>
      </div>

      <span className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 px-3 py-1.5 text-xs font-semibold text-[var(--jy-bg-primary)] shadow-md group-hover:brightness-110">
        Return
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

export default ActiveSessionBanner;
