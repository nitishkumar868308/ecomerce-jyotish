"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Hourglass,
  Sparkles,
  Timer,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { ChatWindow } from "@/components/jyotish/chat/ChatWindow";
import { EndChatConfirm } from "@/components/jyotish/chat/EndChatConfirm";
import {
  useEndChat,
  useJyotishChatSession,
} from "@/services/jyotish/sessions";
import { useChatLiveStatus } from "@/services/chat";
import { useUIStore } from "@/stores/useUIStore";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { Loader } from "@/components/ui/Loader";
import { cn } from "@/lib/utils";

/**
 * Astrologer-side chat room. Mirrors the shopper layout (hero header +
 * billing strip + ChatWindow) but flips the perspective:
 *
 *   - Header shows the SHOPPER avatar/name + live session timer.
 *   - Billing strip shows what the astrologer has earned so far and
 *     the shopper's remaining minutes — the astrologer can see the
 *     runway drying up and wrap the consultation gracefully.
 *   - "End chat" fires the same mutation either side can use.
 *
 * Billing maths are identical because backend `tickBilling` runs on
 * any status poll — so the astrologer's 3s session refetch also keeps
 * the live numbers current.
 */
export default function AstrologerChatPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session, isLoading } = useJyotishChatSession(sessionId, {
    pollMs: 3000,
  });
  const { data: live } = useChatLiveStatus(sessionId);
  const endChat = useEndChat();
  const startTransition = useUIStore((s) => s.startTransition);
  const endTransition = useUIStore((s) => s.endTransition);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const status = String((session as any)?.status ?? "").toUpperCase();

  // Dismiss any inbound "Starting chat…" overlay once this page has
  // loaded into a known state. Covers all settled branches so the
  // overlay never gets orphaned.
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

  // Hooks must run in the same order every render, so all of them —
  // including useElapsed — have to sit above any conditional return.
  // When isLoading flipped off, the old layout suddenly introduced
  // useElapsed on that first "has-session" render and React flagged
  // a hook-order mismatch.
  const elapsed = useElapsed(session?.startedAt);

  // When the session closes on its own (shopper ended, insufficient
  // balance, timeout), bounce the astrologer back to the dashboard
  // after a beat so they're not stuck on a dead page.
  useEffect(() => {
    if (status === "ACTIVE" || status === "PAUSED" || status === "PENDING") return;
    if (!status) return;
    const t = setTimeout(
      () => router.push("/jyotish/astrologer-dashboard/requests"),
      5000,
    );
    return () => clearTimeout(t);
  }, [status, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader variant="section" message="Loading session..." />
      </div>
    );
  }

  const userAny: any = session?.user ?? {};
  const name =
    userAny.name ?? userAny.fullName ?? (session as any)?.userName ?? "User";
  const imgRaw = userAny.profileImage ?? userAny.avatar;
  const imgSrc = imgRaw ? resolveAssetUrl(imgRaw) || imgRaw : "";

  const perMinute = Number((session as any)?.pricePerMinute ?? 0);
  const charged = Number(
    live?.totalCharged ?? (session as any)?.totalCharged ?? 0,
  );
  // Earnings come straight from the backend now — tickBilling has
  // already applied the revenue split, so `astrologerEarning` on the
  // live/session row is authoritative. The frontend multiplication
  // we had before was a stale fallback that ignored GST.
  const astrologerEarnings = Number(
    live?.astrologerEarning ??
      (session as any)?.astrologerEarning ??
      0,
  );
  const minutesBilled = Number(
    live?.minutesBilled ?? (session as any)?.minutesBilled ?? 0,
  );
  const walletBalance = Number(live?.walletBalance ?? 0);
  const freeMinutesGranted = Number(
    live?.freeMinutesGranted ?? (session as any)?.freeMinutesGranted ?? 0,
  );
  const freeSecondsLeft = Number(live?.freeSecondsLeft ?? 0);
  const inFreeWindow = freeMinutesGranted > 0 && freeSecondsLeft > 0;
  const minutesLeft =
    perMinute > 0 ? Math.floor(walletBalance / perMinute) : null;
  // Match the shopper-side "1 min left" warning so both sides go red
  // simultaneously — avoids the astrologer keeping the session alive
  // when the shopper is already seeing "add money" alarms.
  const lowBalance =
    !inFreeWindow &&
    perMinute > 0 &&
    minutesLeft !== null &&
    minutesLeft <= 1;

  const userTyping = Boolean(live?.typing?.user);
  const userAddingMoney = Boolean(live?.userAddingMoney);
  const isClosed =
    status === "ENDED" || status === "REJECTED" || status === "PAUSED";

  const confirmEnd = async () => {
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
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-4xl flex-col px-4 py-4 sm:px-6">
      {/* Hero header */}
      <div className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--jy-accent-purple)]/25 via-[#15102a]/70 to-[var(--jy-accent-gold)]/15 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/jyotish/astrologer-dashboard/requests"
            className="rounded-lg p-1.5 text-[var(--jy-text-muted)] hover:bg-white/5 hover:text-white"
            aria-label="Back to requests"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[var(--jy-accent-gold)]/60 bg-[var(--jy-accent-purple)]/25">
            {imgSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={imgSrc} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[var(--jy-accent-gold)]">
                <User className="h-5 w-5" />
              </div>
            )}
            {status === "ACTIVE" && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-[#15102a] bg-emerald-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-bold text-[var(--jy-text-primary)]">
                {name}
              </h2>
              <StatusChip status={status} />
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
            disabled={endChat.isPending || isClosed}
            className="shrink-0 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-60"
          >
            {endChat.isPending ? "Ending…" : "End chat"}
          </button>
        </div>
      </div>

      {/* Billing strip — astrologer slant (earnings) */}
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
                label="Free offer"
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
            label="Your earnings"
            value={`₹${astrologerEarnings.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })} · ${minutesBilled}m`}
          />
          <BillingChip
            label="User wallet"
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
        {!isClosed && userAddingMoney ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
            <Wallet className="h-3 w-3 animate-pulse" />
            User is topping up wallet…
          </span>
        ) : lowBalance && !isClosed ? (
          <span className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-200">
            <Wallet className="h-3 w-3" /> Low balance — may end soon
          </span>
        ) : null}
      </div>

      <ChatWindow
        sessionId={sessionId}
        otherTyping={userTyping}
        readOnly={isClosed}
      />

      <EndChatConfirm
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmEnd}
        pending={endChat.isPending}
        variant="astrologer"
        elapsedLabel={formatElapsed(elapsed)}
        spentLabel={`₹${astrologerEarnings.toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })} · ${minutesBilled}m`}
      />

      {status === "ENDED" && (
        <ClosedBanner
          title="Session ended"
          body={`You spoke for ${minutesBilled} minute(s). Earnings: ₹${astrologerEarnings.toLocaleString(
            "en-IN",
            { maximumFractionDigits: 2 },
          )}.`}
          icon={<Hourglass className="h-4 w-4" />}
        />
      )}
      {status === "REJECTED" && (
        <ClosedBanner
          title="Session not started"
          body="This request was rejected or expired."
          icon={<XCircle className="h-4 w-4" />}
        />
      )}
    </div>
  );
}

/* ───────────── bits ───────────── */

function StatusChip({ status }: { status: string }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
        <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
        Live
      </span>
    );
  }
  const cls =
    status === "PENDING"
      ? "border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/10 text-[var(--jy-accent-gold)]"
      : status === "REJECTED"
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : "border-white/10 bg-white/5 text-[var(--jy-text-muted)]";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
        cls,
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}

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

function ClosedBanner({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[var(--jy-text-secondary)]">
      <span className="mt-0.5 text-[var(--jy-accent-gold)]">{icon}</span>
      <div>
        <p className="font-semibold text-[var(--jy-text-primary)]">{title}</p>
        <p className="mt-0.5 text-xs text-[var(--jy-text-muted)]">{body}</p>
      </div>
    </div>
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
