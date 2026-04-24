"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Star, X } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSubmitReview } from "@/services/jyotish/sessions";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  /** ENDED session record from `/my-history` or the chat page. */
  session: any;
  onClose: () => void;
  /** When true, the modal has no close button — the shopper must submit
   *  a rating to move on. Used on the chat page at session end; history
   *  mode keeps it dismissible so past sessions aren't gate-kept. */
  mandatory?: boolean;
}

/**
 * Post-session feedback form. Captures 1-5 star rating + free-text
 * comment and POSTs to `/jyotish/chat/:id/review`. The backend fires
 * confirmation emails to both parties on success. Persisted via the
 * `AstrologerReview` model so the review shows up on the user's
 * history table on subsequent visits (no re-prompt).
 */
export function ReviewModal({ open, session, onClose, mandatory }: Props) {
  const { user } = useAuthStore();
  const submit = useSubmitReview();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  // Reset when the targeted session changes (otherwise a second
  // session would inherit the previous rating draft).
  useEffect(() => {
    if (!open) return;
    setRating(0);
    setHover(0);
    setComment("");
  }, [open, session?.id]);

  if (!open || !session) return null;

  const astro = session.astrologer ?? {};
  const name = astro.displayName ?? astro.fullName ?? "Your astrologer";
  const imgRaw = astro.profile?.image ?? astro.profileImage;
  const imgSrc = imgRaw ? resolveAssetUrl(imgRaw) || imgRaw : "";
  const seconds = Number(
    session.secondsBilled ?? (session.minutesBilled ?? 0) * 60,
  );

  const userId = Number((user as { id?: number | string } | null)?.id);
  const canSubmit = rating >= 1 && rating <= 5 && !submit.isPending;

  const handleSubmit = async () => {
    if (!canSubmit || !userId) return;
    try {
      await submit.mutateAsync({
        sessionId: Number(session.id),
        userId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Thanks for your review!");
      onClose();
    } catch {
      // toast already raised via mutation onError
    }
  };

  const display = hover || rating;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={mandatory ? undefined : onClose}
      />
      {/* Colours are hardcoded (amber/purple/white slashes) instead of
          the jyotish `--jy-*` CSS vars because this modal is also
          rendered from the user dashboard + consult-now surfaces which
          don't wrap their tree in the `jyotish-dark` scope — the vars
          resolve to empty there and the whole card reads as black-on-
          black. Hardcoded palette looks correct on every surface. */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-amber-300/30 bg-gradient-to-br from-[#15102a] via-[#0f0a24] to-[#0b0719] text-white shadow-2xl">
        {!mandatory && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full p-1.5 text-white/60 hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="px-6 pb-2 pt-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300">
            {mandatory ? "Your feedback is required" : "Leave a review"}
          </p>
          <div className="mx-auto mt-4 h-16 w-16 overflow-hidden rounded-full border-2 border-amber-300/50 bg-purple-600/30">
            {imgSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={imgSrc} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-amber-300">
                <Star className="h-6 w-6" />
              </div>
            )}
          </div>
          <h3 className="mt-3 text-lg font-bold text-white">
            How was your session with {name}?
          </h3>
          {seconds > 0 && (
            <p className="mt-1 text-xs text-white/60">
              {formatDuration(seconds)} ·{" "}
              ₹{Number(session.totalCharged ?? 0).toLocaleString("en-IN")}
            </p>
          )}
        </div>

        <div className="px-6 pb-5">
          <div className="flex items-center justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = n <= display;
              return (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  aria-label={`Rate ${n}`}
                  className="rounded-lg p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      filled
                        ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                        : "text-white/30",
                    )}
                  />
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-center text-xs text-white/60">
            {display === 0
              ? "Tap a star to rate"
              : display === 5
                ? "Loved it"
                : display === 4
                  ? "Very good"
                  : display === 3
                    ? "It was okay"
                    : display === 2
                      ? "Could be better"
                      : "Disappointing"}
          </p>

          <label className="mt-4 block text-[10px] font-semibold uppercase tracking-wider text-white/60">
            Share your experience (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="A few words about the guidance, clarity, or anything memorable…"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-300/50"
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 py-2.5 text-sm font-semibold text-slate-900 shadow-md hover:brightness-110 disabled:opacity-60"
          >
            {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {submit.isPending ? "Submitting…" : "Submit review"}
          </button>
          <p className="mt-2 text-center text-[10px] text-white/50">
            We&rsquo;ll email you a copy and share it with the astrologer.
          </p>
        </div>
      </div>
    </div>
  );
}

function formatDuration(totalSec: number) {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export default ReviewModal;
