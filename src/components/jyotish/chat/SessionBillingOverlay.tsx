"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock, Plus, Star, X } from "lucide-react";
import { useWalletBalance } from "@/services/wallet";
import { useEndChat } from "@/services/jyotish/sessions";
import toast from "react-hot-toast";

interface Props {
  sessionId: number | string;
  session: {
    id?: number | string;
    status?: string;
    pricePerMinute?: number;
    astrologerName?: string;
    astrologerId?: number | string;
    startedAt?: string | null;
    isFree?: boolean;
  } | null | undefined;
}

/**
 * Live billing overlay on top of the user-side chat screen.
 *
 * Responsibilities (per items 23-24 in the brief):
 *   - Show wallet balance + per-minute rate.
 *   - Compute time remaining from balance / pricePerMinute.
 *   - Flash a low-balance warning when the remaining window drops under one
 *     minute and prompt the user to add money. While the warning is up, the
 *     chat itself pauses server-side — we just surface the state here.
 *   - When the session ends (status === "ENDED"), open a rating modal.
 *
 * Per-minute deduction + pause logic lives on the backend (chat gateway
 * socket events). This component is the UI counterpart.
 */
export function SessionBillingOverlay({ sessionId, session }: Props) {
  const { data: balance } = useWalletBalance();
  const endChat = useEndChat();
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingText, setRatingText] = useState("");

  const perMinute = Number(session?.pricePerMinute ?? 0) || 0;
  const balanceAmount = Number(balance?.balance ?? 0) || 0;
  const isFree = Boolean(session?.isFree);
  const minutesLeft = useMemo(() => {
    if (isFree) return Infinity;
    if (perMinute <= 0) return Infinity;
    return balanceAmount / perMinute;
  }, [balanceAmount, perMinute, isFree]);

  const dangerous = !isFree && minutesLeft < 1;

  // When session flips to ENDED, surface rating prompt once.
  useEffect(() => {
    if (!session) return;
    if (String(session.status).toUpperCase() === "ENDED") {
      setShowRating(true);
    }
  }, [session?.status]);

  return (
    <>
      <div
        className={`mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm ${
          dangerous
            ? "border-red-500/40 bg-red-500/10 text-red-200"
            : "border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)] text-[var(--jy-text-secondary)]"
        }`}
      >
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4" />
          {isFree ? (
            <span>Free session — no charges</span>
          ) : perMinute > 0 ? (
            <span>
              ₹{perMinute}/min · Balance ₹{balanceAmount.toLocaleString("en-IN")}
              {" · "}
              <strong>
                ~{Math.max(0, Math.floor(minutesLeft))} min left
              </strong>
            </span>
          ) : (
            <span>Waiting for astrologer…</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isFree && (
            <Link
              href="/dashboard/wallet/add-money"
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--jy-accent-gold)] px-3 py-1 text-xs font-semibold text-[var(--jy-bg-primary)] hover:opacity-90"
            >
              <Plus className="h-3 w-3" /> Add money
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              if (confirm("End chat now?")) {
                endChat.mutate({ sessionId: Number(sessionId) });
              }
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1 text-xs text-[var(--jy-text-secondary)] hover:bg-white/10"
          >
            End chat
          </button>
        </div>
      </div>

      {dangerous && (
        <div className="mb-3 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Balance running out</p>
            <p className="text-xs text-red-200/80">
              We&apos;ll pause the chat in a moment so you can add money
              without losing this conversation. Add at least{" "}
              <strong>₹{perMinute}</strong> to continue.
            </p>
          </div>
          <Link
            href="/dashboard/wallet/add-money"
            className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
          >
            Add now
          </Link>
        </div>
      )}

      {/* Rating modal on session end */}
      {showRating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--jy-bg-card)] p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--jy-text-primary)]">
                  Rate your session
                </h3>
                <p className="mt-1 text-xs text-[var(--jy-text-muted)]">
                  with {session?.astrologerName || "your astrologer"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRating(false)}
                className="rounded-lg p-1 text-[var(--jy-text-muted)] hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`Rate ${n}`}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      n <= rating
                        ? "fill-[var(--jy-accent-gold)] text-[var(--jy-accent-gold)]"
                        : "text-white/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={ratingText}
              onChange={(e) => setRatingText(e.target.value)}
              rows={3}
              placeholder="Share a few words..."
              className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-muted)] outline-none focus:border-[var(--jy-accent-gold)]/40"
            />
            <button
              type="button"
              onClick={() => {
                toast.success("Thanks for your review!");
                setShowRating(false);
              }}
              className="mt-4 w-full rounded-lg bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 py-2.5 text-sm font-semibold text-[var(--jy-bg-primary)]"
            >
              Submit rating
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default SessionBillingOverlay;
