"use client";

import React from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pending?: boolean;
  /** Tailored wording per side — the astrologer sees slightly different
   *  copy than the shopper (earnings vs wallet). */
  variant?: "user" | "astrologer";
  elapsedLabel?: string;
  spentLabel?: string;
}

/**
 * Replaces the browser `confirm()` for ending a chat. Native confirm
 * blocks the JS event loop on some platforms — feels sluggish and
 * can't be styled. This modal:
 *
 *   - Renders in-app, dark theme, looks like everything else.
 *   - Fires the "End chat" mutation the moment the user confirms,
 *     with no other gates in the way, so billing halts quickly.
 *   - Shows pending state while the server wraps the session.
 */
export function EndChatConfirm({
  open,
  onClose,
  onConfirm,
  pending,
  variant = "user",
  elapsedLabel,
  spentLabel,
}: Props) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={pending ? undefined : onClose}
      />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#15102a] via-[#0f0a24] to-[#0b0719] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="absolute right-3 top-3 rounded-full p-1.5 text-[var(--jy-text-muted)] hover:bg-white/5 hover:text-white disabled:opacity-40"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pb-4 pt-6 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-300">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-[var(--jy-text-primary)]">
            End this chat?
          </h3>
          <p className="mt-2 text-xs text-[var(--jy-text-secondary)]">
            {variant === "astrologer"
              ? "The shopper will be notified immediately. Billing stops at the next full minute — no further charges."
              : "Billing will stop at the current minute. You won't be able to resume — you'd need to start a new session."}
          </p>

          {(elapsedLabel || spentLabel) && (
            <div className="mt-4 flex justify-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs">
              {elapsedLabel && (
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--jy-text-faint)]">
                    Session
                  </p>
                  <p className="font-mono font-semibold text-[var(--jy-accent-gold)]">
                    {elapsedLabel}
                  </p>
                </div>
              )}
              {spentLabel && (
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--jy-text-faint)]">
                    {variant === "astrologer" ? "Earnings" : "Spent"}
                  </p>
                  <p className="font-mono font-semibold text-[var(--jy-text-primary)]">
                    {spentLabel}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-white/5 bg-black/20 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-[var(--jy-text-secondary)] hover:bg-white/10 disabled:opacity-50"
          >
            Keep chatting
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-2 text-xs font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-60"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {pending ? "Ending…" : "End now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EndChatConfirm;
