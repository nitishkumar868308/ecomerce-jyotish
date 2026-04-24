"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, XCircle, X, User } from "lucide-react";
import {
  useJyotishChatSessions,
  useAcceptChat,
  useRejectChat,
} from "@/services/jyotish/sessions";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { cn } from "@/lib/utils";

/**
 * Attention-grabbing pop-up for new incoming chat requests on the
 * astrologer dashboard. Complements the inline PendingChatRequests list
 * — the inline card is the full queue, this popup is the "hey, someone
 * is waiting RIGHT NOW" interrupt so the astrologer doesn't miss a
 * request because they're scrolled past the card.
 *
 * Behaviour:
 *   - Polls sessions list via useJyotishChatSessions (5s).
 *   - Picks the newest PENDING session that hasn't been dismissed or
 *     already actioned from this browser tab.
 *   - Dismissing (X) just hides this popup for that session — the
 *     request stays live in the inline list so nothing is dropped.
 *   - Accept uses the same mutation as inline; reject opens the
 *     reason field inline (no secondary modal).
 */
export function IncomingChatPopup() {
  const router = useRouter();
  const { user } = useAuthStore();
  const startTransition = useUIStore((s) => s.startTransition);
  const astrologerId = user?.id;
  const { data: sessions } = useJyotishChatSessions(astrologerId);
  const accept = useAcceptChat();
  const reject = useRejectChat();

  // Sessions the astrologer already dismissed from the popup in this
  // session. Kept per-tab on purpose — a fresh reload should show the
  // popup again so nothing is silently lost across devices.
  const [dismissed, setDismissed] = useState<Set<number>>(() => new Set());

  // "Just arrived" flag drives the subtle shake + chime animation on
  // first render. We set it once per sessionId so it doesn't retrigger
  // on every poll.
  const lastPingedRef = useRef<number | null>(null);
  const [pinged, setPinged] = useState(false);

  const [rejectingSessionId, setRejectingSessionId] = useState<number | null>(
    null,
  );
  const [reason, setReason] = useState("");

  const pending = (sessions ?? []).filter(
    (s: any) =>
      String(s.status).toUpperCase() === "PENDING" ||
      String(s.status).toUpperCase() === "REQUESTED",
  );
  // Newest first is how the API sorts, so index 0 is the one to surface.
  const current = pending.find((s: any) => !dismissed.has(Number(s.id)));

  useEffect(() => {
    if (!current) {
      setPinged(false);
      return;
    }
    if (lastPingedRef.current === Number(current.id)) return;
    lastPingedRef.current = Number(current.id);
    setPinged(true);
    const t = setTimeout(() => setPinged(false), 1400);
    return () => clearTimeout(t);
  }, [current?.id]);

  if (!current) return null;

  const userLabel =
    current.userName ??
    current.user?.name ??
    current.user?.fullName ??
    `User #${current.userId}`;
  const userImg = current.user?.avatar || current.user?.profileImage;
  const src = userImg ? resolveAssetUrl(userImg) || userImg : "";
  const whenIso = current.requestedAt ?? current.createdAt;
  const when = whenIso
    ? new Date(whenIso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const dismiss = () =>
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(Number(current.id));
      return next;
    });

  const handleAccept = async () => {
    // Flash the global overlay during accept + route change so the
    // astrologer sees immediate feedback instead of a static popup
    // while the mutation resolves. The chat page clears the overlay
    // on mount.
    startTransition("Starting chat…");
    await accept.mutateAsync({
      sessionId: Number(current.id),
      astrologerId: Number(astrologerId),
    });
    router.push(`/jyotish/astrologer-dashboard/chat/${current.id}`);
  };

  const handleReject = async () => {
    if (reason.trim().length < 3) return;
    await reject.mutateAsync({
      sessionId: Number(current.id),
      astrologerId: Number(astrologerId),
      reason: reason.trim(),
    });
    setRejectingSessionId(null);
    setReason("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[min(360px,calc(100vw-2rem))]">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-[var(--jy-accent-gold)]/40 bg-gradient-to-br from-[#15102a] via-[#0f0a24] to-[#0b0719] shadow-2xl shadow-[var(--jy-accent-gold)]/10",
          pinged && "animate-[wiggle_0.6s_ease-in-out_2]",
        )}
      >
        {/* Pulsing gold accent along the top to grab the eye */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--jy-accent-gold)] to-transparent",
            pinged ? "opacity-100" : "opacity-70 animate-pulse",
          )}
        />

        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2 top-2 rounded-full p-1.5 text-[var(--jy-text-muted)] hover:bg-white/5 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-4 pb-4 pt-4">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--jy-accent-gold)]">
            <Bell className="h-3 w-3 animate-pulse" />
            Incoming request
          </div>

          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-[var(--jy-accent-gold)]/40 bg-[var(--jy-accent-purple)]/30">
                {src ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={src}
                    alt={userLabel}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[var(--jy-accent-gold)]">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#0f0a24] bg-[var(--jy-accent-gold)]">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--jy-text-primary)]">
                {userLabel}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--jy-text-muted)]">
                Waiting for you to accept · {when}
              </p>
              {current.pricePerMinute > 0 && (
                <p className="mt-1 text-[11px] text-[var(--jy-accent-gold)]">
                  ₹{Number(current.pricePerMinute).toLocaleString()} / min
                </p>
              )}
            </div>
          </div>

          {rejectingSessionId === Number(current.id) ? (
            <div className="mt-4 space-y-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--jy-text-muted)]">
                Reason for declining
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="e.g. Busy with another consultation."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-muted)] outline-none focus:border-[var(--jy-accent-gold)]/40"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingSessionId(null);
                    setReason("");
                  }}
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-[11px] text-[var(--jy-text-secondary)] hover:bg-white/10"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={reject.isPending || reason.trim().length < 3}
                  className="rounded-lg bg-red-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {reject.isPending ? "Sending…" : "Send rejection"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleAccept}
                disabled={accept.isPending}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:brightness-110 disabled:opacity-60"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {accept.isPending ? "Accepting…" : "Accept"}
              </button>
              <button
                type="button"
                onClick={() => setRejectingSessionId(Number(current.id))}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Local wiggle keyframes — Tailwind doesn't ship this by default
          and pulling in a plugin for one animation is overkill. */}
      <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}

export default IncomingChatPopup;
