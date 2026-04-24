"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Hourglass,
  Loader2,
  MessageCircle,
  Phone,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { useUIStore } from "@/stores/useUIStore";
import { useJyotishChatSession, useEndChat } from "@/services/jyotish/sessions";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

/**
 * "Connecting to astrologer…" modal shown right after a user kicks off
 * a chat/call. It keeps the shopper on the current page while the
 * backend session is in PENDING — only once the astrologer accepts
 * (status flips to ACTIVE) do we redirect to the chat room. That
 * sequence is important: landing on /jyotish/chat/[sessionId] before
 * acceptance leaves the shopper staring at an empty pending chat, and
 * they can't tell the astrologer hasn't picked up yet.
 *
 * Driven by `useUIStore.connecting` — the consultation launcher sets
 * it after startSession succeeds; this modal mounts globally in the
 * jyotish layout and reacts. Polls the session every 2s for status.
 *
 * Outcomes:
 *   - ACTIVE   → close + navigate to /jyotish/chat/{sessionId}
 *   - REJECTED → surface rejection reason, let shopper dismiss
 *   - user hits Cancel before accept → we fire endChat so the astrologer
 *     stops seeing a ghost PENDING tile and isBusy never gets flipped.
 */
export function ConnectingModal() {
  const router = useRouter();
  const connecting = useUIStore((s) => s.connecting);
  const closeConnecting = useUIStore((s) => s.closeConnecting);
  const startTransition = useUIStore((s) => s.startTransition);
  const endChat = useEndChat();

  const sessionId = connecting?.sessionId ?? "";
  // Fast poll while the modal is open so acceptance lands in the UI
  // within a second — anything slower feels laggy and shoppers start
  // to wonder if the request even made it through.
  const { data: session } = useJyotishChatSession(sessionId, {
    pollMs: connecting ? 1000 : undefined,
  } as any);

  const status = String((session as any)?.status ?? "").toUpperCase();

  useEffect(() => {
    if (!connecting) return;
    if (status === "ACTIVE") {
      // Close the modal, pop the full-page mystical loader, then
      // navigate. Without the overlay the user sees a brief blank
      // page while the chat route mounts — long enough to feel
      // broken. The chat page clears `transitionMessage` on mount.
      closeConnecting();
      startTransition("Opening chat…");
      router.push(`/jyotish/chat/${connecting.sessionId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, connecting?.sessionId]);

  if (!connecting) return null;

  // Auto-expired PENDINGs come back as REJECTED with endReason='timeout'
  // — distinguish them so the shopper sees "didn't respond in time"
  // rather than a manual "they declined" message.
  const isTimeout =
    status === "REJECTED" && (session as any)?.endReason === "timeout";
  const isRejected = status === "REJECTED" && !isTimeout;
  const isTerminal = isTimeout || isRejected;
  const rejectionReason =
    (session as any)?.rejectionReason ?? (session as any)?.rejectReason ?? null;

  const imgSrc = connecting.astrologerImage
    ? resolveAssetUrl(connecting.astrologerImage) || connecting.astrologerImage
    : "";

  const handleCancel = async () => {
    // Only fire end when the astrologer hasn't already responded — on
    // REJECTED/TIMEOUT/ENDED the server has already wrapped things up.
    if (!isTerminal && status !== "ENDED") {
      try {
        await endChat.mutateAsync({ sessionId: Number(connecting.sessionId) });
      } catch {
        // non-fatal — the shopper still wants the modal gone.
      }
    }
    closeConnecting();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#15102a] via-[#0f0a24] to-[#0b0719] shadow-2xl">
        <button
          type="button"
          onClick={handleCancel}
          className="absolute right-3 top-3 rounded-full p-1.5 text-[var(--jy-text-muted)] hover:bg-white/5 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative px-6 pb-5 pt-8 text-center">
          {/* Glow rings behind the avatar — pulse while PENDING, dim on
              REJECTED/TIMEOUT so the tone changes with the state. */}
          <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
            <div
              className={cn(
                "h-28 w-28 rounded-full blur-2xl",
                isTerminal
                  ? "bg-red-500/20"
                  : "bg-[var(--jy-accent-gold)]/25 animate-pulse",
              )}
            />
          </div>

          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            {!isTerminal && (
              <>
                <span className="absolute inset-0 animate-ping rounded-full bg-[var(--jy-accent-gold)]/30" />
                <span className="absolute -inset-1 animate-pulse rounded-full border border-[var(--jy-accent-gold)]/40" />
              </>
            )}
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[var(--jy-accent-gold)]/60 bg-[var(--jy-accent-purple)]/25">
              {imgSrc ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imgSrc}
                  alt={connecting.astrologerName ?? "Astrologer"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[var(--jy-accent-gold)]">
                  <Sparkles className="h-8 w-8" />
                </div>
              )}
            </div>
          </div>

          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--jy-accent-gold)]">
            {connecting.medium === "call" ? "Calling" : "Connecting"}
          </p>
          <h3 className="mt-1 text-lg font-bold text-[var(--jy-text-primary)]">
            {connecting.astrologerName || "Astrologer"}
          </h3>

          {isTimeout ? (
            <>
              <div className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-300">
                <Hourglass className="h-3.5 w-3.5" />
                No response in time
              </div>
              <p className="mt-3 text-xs text-[var(--jy-text-muted)]">
                The astrologer didn&rsquo;t pick up within a minute — they may
                be away from their dashboard. Please try another astrologer.
              </p>
            </>
          ) : isRejected ? (
            <>
              <div className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-300">
                <XCircle className="h-3.5 w-3.5" />
                Request declined
              </div>
              {rejectionReason && (
                <p className="mt-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-[var(--jy-text-secondary)]">
                  “{rejectionReason}”
                </p>
              )}
              <p className="mt-3 text-xs text-[var(--jy-text-muted)]">
                This astrologer isn&rsquo;t available right now. Try another
                from the consult list.
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--jy-text-secondary)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--jy-accent-gold)]" />
                Waiting for them to accept…
              </p>
              <p className="mt-3 text-[11px] text-[var(--jy-text-muted)]">
                Please keep this window open. We&rsquo;ll take you straight
                into the {connecting.medium === "call" ? "call" : "chat"} once
                they&rsquo;re ready.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-[var(--jy-text-muted)]">
                {connecting.medium === "call" ? (
                  <Phone className="h-3 w-3" />
                ) : (
                  <MessageCircle className="h-3 w-3" />
                )}
                {connecting.medium === "call" ? "Voice call" : "Text chat"}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 border-t border-white/5 bg-black/20 px-4 py-3">
          {isTerminal ? (
            <button
              type="button"
              onClick={() => {
                closeConnecting();
                router.push("/jyotish/consult-now");
              }}
              className="flex-1 rounded-xl bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 py-2 text-xs font-semibold text-[var(--jy-bg-primary)]"
            >
              Try another astrologer
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancel}
              disabled={endChat.isPending}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-[var(--jy-text-secondary)] hover:bg-white/10 disabled:opacity-60"
            >
              {endChat.isPending ? "Cancelling…" : "Cancel request"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConnectingModal;
