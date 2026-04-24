"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Hourglass,
  Loader2,
  Plus,
  Sparkles,
  Timer,
  Wallet,
  XCircle,
} from "lucide-react";
import { ChatWindow } from "@/components/jyotish/chat/ChatWindow";
import { EndChatConfirm } from "@/components/jyotish/chat/EndChatConfirm";
import { ReviewModal } from "@/components/jyotish/chat/ReviewModal";
import { AddMoneyModal } from "@/components/jyotish/chat/AddMoneyModal";
import {
  useEndChat,
  useJyotishChatSession,
} from "@/services/jyotish/sessions";
import { useChatLiveStatus } from "@/services/chat";
import { useUIStore } from "@/stores/useUIStore";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { Loader } from "@/components/ui/Loader";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

/**
 * Shopper-facing chat room. Three visual zones:
 *
 *   1. Hero header — big astrologer avatar, name, live status + session
 *      timer ticking client-side (synced to startedAt). Gives the user
 *      an unambiguous "you are in a consultation with X" cue.
 *   2. Billing strip — rate/min, wallet balance, estimated minutes
 *      remaining, plus the Add Money + End Chat CTAs. Turns red when
 *      the balance falls under a minute; the backend will auto-end
 *      shortly after.
 *   3. ChatWindow — messages + emoji composer.
 *
 * Guarded against direct visits: PENDING sessions get a "waiting"
 * state, REJECTED/ENDED/insufficient_balance each get their own card
 * with redirect-back behaviour.
 */
export default function JyotishChatPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session, isLoading } = useJyotishChatSession(sessionId, {
    pollMs: 3000,
  });
  const { data: live } = useChatLiveStatus(sessionId);
  const endTransition = useUIStore((s) => s.endTransition);

  const status = String((session as any)?.status ?? "").toUpperCase();

  // Clear the global transition overlay once the chat page has
  // settled into any terminal or live state. Running this in an
  // effect (not render) avoids the "setState during render" warning
  // and keeps the loader visible through the brief window between
  // navigation and data landing.
  useEffect(() => {
    if (isLoading) return;
    if (
      status === "ACTIVE" ||
      status === "PAUSED" ||
      status === "ENDED" ||
      status === "REJECTED" ||
      status === "PENDING"
    ) {
      endTransition();
    }
  }, [isLoading, status, endTransition]);

  const reviewExists = !!(session as any)?.review;
  const shouldReview = status === "ENDED" && !reviewExists;

  // Bounce the shopper off finished/declined sessions after a beat so
  // they read the copy first. Skip the auto-redirect while the review
  // modal is pending — we want to hold them on the page until they
  // rate the session.
  useEffect(() => {
    if (status !== "ENDED" && status !== "REJECTED") return;
    if (shouldReview) return;
    const t = setTimeout(() => router.push("/jyotish/consult-now"), 4500);
    return () => clearTimeout(t);
  }, [status, router, shouldReview]);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader variant="section" message="Connecting to your astrologer..." />
      </div>
    );
  }

  if (status === "PENDING") return <WaitingState session={session} />;

  if (status === "REJECTED") {
    const isTimeout = (session as any)?.endReason === "timeout";
    return (
      <EndedState
        title={
          isTimeout
            ? "Astrologer didn't respond in time"
            : "Astrologer declined the session"
        }
        icon={
          isTimeout ? (
            <Hourglass className="h-8 w-8" />
          ) : (
            <XCircle className="h-8 w-8" />
          )
        }
        body={
          isTimeout
            ? "They may be away from their dashboard. Redirecting you to pick another astrologer…"
            : ((session as any)?.rejectionReason ??
              "They couldn't take this consultation right now. Redirecting you to pick another astrologer…")
        }
        tone="red"
      />
    );
  }

  if (status === "ENDED") {
    const reason = (session as any)?.endReason;
    const lowBalance = reason === "insufficient_balance";
    return (
      <>
        <EndedState
          title={
            lowBalance
              ? "Session paused — wallet ran out"
              : "This session has ended"
          }
          icon={
            lowBalance ? (
              <Wallet className="h-8 w-8" />
            ) : (
              <Hourglass className="h-8 w-8" />
            )
          }
          body={
            lowBalance
              ? `You spoke for ${(session as any)?.minutesBilled ?? 0} minute(s). Add money to start a fresh session with the astrologer.`
              : shouldReview
                ? `You spoke for ${(session as any)?.minutesBilled ?? 0} minute(s). Please rate your session to continue.`
                : `You spoke for ${(session as any)?.minutesBilled ?? 0} minute(s). Redirecting you back…`
          }
          tone={lowBalance ? "amber" : "muted"}
          cta={
            lowBalance
              ? { label: "Add money", href: "/dashboard/wallet/add-money" }
              : undefined
          }
        />
        {/* Mandatory post-session review — blocks the shopper until
            they've rated the astrologer. Auto-hidden once `session.review`
            exists (server-side unique constraint backs this up so a
            refresh doesn't re-prompt). */}
        <ReviewModal
          open={shouldReview}
          session={session}
          onClose={() => router.push("/jyotish/consult-now")}
          mandatory
        />
      </>
    );
  }

  return <ActiveChat session={session} live={live} sessionId={sessionId} />;
}

/* ───────────── Active chat shell ───────────── */

function ActiveChat({
  session,
  live,
  sessionId,
}: {
  session: any;
  live: any;
  sessionId: string;
}) {
  const endChat = useEndChat();
  const startTransition = useUIStore((s) => s.startTransition);
  const endTransition = useUIStore((s) => s.endTransition);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const astroAny = session?.astrologer ?? {};
  const name =
    astroAny.displayName ??
    astroAny.fullName ??
    session?.astrologerName ??
    "Astrologer";
  const imgRaw = astroAny.profile?.image ?? astroAny.profileImage;
  const imgSrc = imgRaw ? resolveAssetUrl(imgRaw) || imgRaw : "";

  const elapsed = useElapsed(session?.startedAt);
  const perMinute = Number(session?.pricePerMinute ?? 0);
  const walletBalance = Number(live?.walletBalance ?? 0);
  const minutesBilled = Number(live?.minutesBilled ?? session?.minutesBilled ?? 0);
  const charged = Number(live?.totalCharged ?? session?.totalCharged ?? 0);
  const freeMinutesGranted = Number(
    live?.freeMinutesGranted ?? session?.freeMinutesGranted ?? 0,
  );
  const freeSecondsLeft = Number(live?.freeSecondsLeft ?? 0);
  const inFreeWindow = freeMinutesGranted > 0 && freeSecondsLeft > 0;
  const minutesLeft = perMinute > 0 ? Math.floor(walletBalance / perMinute) : null;
  // Warn at 1 minute remaining (not 0) so the shopper has time to
  // top up before the session auto-ends on the next tick. "<=1"
  // catches the classic "₹30 left at ₹30/min" scenario that was
  // falling through the cracks of the old `< 1` check.
  const lowBalance =
    !inFreeWindow &&
    perMinute > 0 &&
    minutesLeft !== null &&
    minutesLeft <= 1;

  const astroTyping = Boolean(live?.typing?.astrologer);

  const confirmEnd = async () => {
    // Close the small confirm modal first + swap in the full-page
    // loader — stopping the timer + billing feels faster when a big
    // centred spinner takes over than when the tiny modal button
    // just ticks for a second. `EndedState` auto-clears the overlay
    // below.
    setConfirmOpen(false);
    startTransition("Ending chat…");
    try {
      await endChat.mutateAsync({ sessionId: Number(sessionId) });
    } catch {
      endTransition();
      setConfirmOpen(true);
      return;
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-4 sm:px-6">
      {/* Hero header */}
      <div className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--jy-accent-purple)]/25 via-[#15102a]/70 to-[var(--jy-accent-gold)]/15 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/jyotish/consult-now"
            className="rounded-lg p-1.5 text-[var(--jy-text-muted)] hover:bg-white/5 hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[var(--jy-accent-gold)]/60 bg-[var(--jy-accent-purple)]/25">
            {imgSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={imgSrc} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[var(--jy-accent-gold)]">
                <Sparkles className="h-5 w-5" />
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-[#15102a] bg-emerald-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-bold text-[var(--jy-text-primary)]">
                {name}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                Live
              </span>
            </div>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] text-[var(--jy-text-muted)]">
              <Timer className="h-3 w-3 text-[var(--jy-accent-gold)]" />
              <span className="font-mono text-[var(--jy-accent-gold)]">
                {formatElapsed(elapsed)}
              </span>
              <span className="text-[var(--jy-text-faint)]">session time</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={endChat.isPending}
            className="shrink-0 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-60"
          >
            {endChat.isPending ? "Ending…" : "End chat"}
          </button>
        </div>
      </div>

      <EndChatConfirm
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmEnd}
        pending={endChat.isPending}
        variant="user"
        elapsedLabel={formatElapsed(elapsed)}
        spentLabel={`₹${charged.toLocaleString("en-IN", { maximumFractionDigits: 2 })} · ${minutesBilled}m`}
      />

      {/* Billing strip */}
      <div
        className={cn(
          "mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs",
          inFreeWindow
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            : lowBalance
              ? "border-red-500/40 bg-red-500/10 text-red-200"
              : "border-white/10 bg-white/[0.03] text-[var(--jy-text-secondary)]",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {inFreeWindow ? (
            <>
              <BillingChip
                label="Free"
                value={`${formatShortDuration(freeSecondsLeft)} left`}
                highlight
              />
              <BillingChip
                label="Then"
                value={perMinute > 0 ? `₹${perMinute}/min` : "Free"}
              />
            </>
          ) : (
            <BillingChip
              label="Rate"
              value={perMinute > 0 ? `₹${perMinute}/min` : "Free"}
            />
          )}
          <BillingChip
            label="Spent"
            value={`₹${charged.toLocaleString("en-IN", { maximumFractionDigits: 2 })} · ${minutesBilled}m`}
          />
          <BillingChip
            label="Wallet"
            value={`₹${walletBalance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
            highlight={lowBalance}
          />
          {!inFreeWindow && minutesLeft !== null && (
            <BillingChip
              label="Remaining"
              value={`~${Math.max(0, minutesLeft)} min`}
              highlight={lowBalance}
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => setAddMoneyOpen(true)}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold",
            lowBalance
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-[var(--jy-accent-gold)] text-[var(--jy-bg-primary)] hover:brightness-110",
          )}
        >
          <Plus className="h-3 w-3" /> Add money
        </button>
      </div>

      <AddMoneyModal
        open={addMoneyOpen}
        onClose={() => setAddMoneyOpen(false)}
        sessionId={sessionId}
        suggestedAmount={perMinute > 0 ? perMinute * 5 : undefined}
      />

      <ChatWindow sessionId={sessionId} otherTyping={astroTyping} />
    </div>
  );
}

/* ───────────── Small bits ───────────── */

function BillingChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--jy-text-faint)]">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-[12px] font-semibold",
          highlight ? "text-red-200" : "text-[var(--jy-text-primary)]",
        )}
      >
        {value}
      </span>
    </span>
  );
}

function useElapsed(startedAt?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  if (!startedAt) return 0;
  return Math.max(0, now - new Date(startedAt).getTime());
}

function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function formatShortDuration(totalSec: number) {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function WaitingState({ session }: { session: any }) {
  const name =
    session?.astrologer?.displayName ??
    session?.astrologer?.fullName ??
    session?.astrologerName ??
    "the astrologer";
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-10 text-center">
      <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-[var(--jy-accent-gold)]/25" />
        <span className="absolute -inset-1 animate-pulse rounded-full border border-[var(--jy-accent-gold)]/40" />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--jy-accent-gold)]/60 bg-[var(--jy-accent-purple)]/25 text-[var(--jy-accent-gold)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--jy-accent-gold)]">
        Waiting for acceptance
      </p>
      <h1 className="mt-2 text-xl font-bold text-[var(--jy-text-primary)]">
        {name} will join in a moment
      </h1>
      <p className="mt-3 text-sm text-[var(--jy-text-secondary)]">
        The astrologer has been notified. This page will automatically become
        the chat room as soon as they accept.
      </p>
      <p className="mt-2 text-xs text-[var(--jy-text-muted)]">
        Keep this tab open. You won&rsquo;t be billed until the session starts.
      </p>
      <a
        href="/jyotish/consult-now"
        className="mt-6 inline-flex items-center gap-1.5 text-xs text-[var(--jy-text-muted)] hover:text-[var(--jy-accent-gold)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Pick another astrologer instead
      </a>
    </div>
  );
}

function EndedState({
  title,
  body,
  icon,
  tone,
  cta,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
  tone: "red" | "muted" | "amber";
  cta?: { label: string; href: string };
}) {
  const toneCls =
    tone === "red"
      ? "border-red-500/30 bg-red-500/10 text-red-300"
      : tone === "amber"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-white/10 bg-white/[0.03] text-[var(--jy-text-muted)]";
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-10 text-center">
      <div
        className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border ${toneCls}`}
      >
        {icon}
      </div>
      <h1 className="text-lg font-bold text-[var(--jy-text-primary)]">
        {title}
      </h1>
      <p className="mt-2 text-sm text-[var(--jy-text-secondary)]">{body}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {cta && (
          <a
            href={cta.href}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 px-4 py-2 text-xs font-semibold text-[var(--jy-bg-primary)]"
          >
            <Plus className="h-3.5 w-3.5" /> {cta.label}
          </a>
        )}
        <a
          href="/jyotish/consult-now"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-[var(--jy-text-primary)] hover:bg-white/10"
        >
          Back to consult list
        </a>
      </div>
    </div>
  );
}
