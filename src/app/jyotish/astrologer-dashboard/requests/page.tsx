"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 10;
import {
  ArrowLeft,
  MessageCircle,
  User,
  Loader2,
  CheckCircle2,
  XCircle,
  Hourglass,
  Clock,
  CircleDot,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import {
  useAllChatRequests,
  useAcceptChat,
  useRejectChat,
} from "@/services/jyotish/sessions";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { cn } from "@/lib/utils";

/**
 * Unified "Requests" page. Shows every chat request the astrologer
 * has received, grouped by status so the list stays scannable:
 *
 *   Active now     — ACTIVE/PAUSED sessions (tap to jump in)
 *   Pending        — fresh requests still inside the 60-sec window
 *   Missed         — PENDINGs that auto-expired (status=REJECTED+timeout)
 *   Declined       — manually rejected
 *   Ended          — completed sessions
 *
 * Filter tabs let the astrologer zoom into one group at a time.
 */
type Tab = "all" | "active" | "pending" | "missed" | "declined" | "ended";

export default function RequestsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const startTransition = useUIStore((s) => s.startTransition);
  const { data: requests, isLoading } = useAllChatRequests(user?.id);
  const accept = useAcceptChat();
  const reject = useRejectChat();
  const [tab, setTab] = useState<Tab>("all");

  const list = (requests ?? []) as Array<any>;

  const categorize = (s: any): Tab => {
    const status = String(s.status).toUpperCase();
    const endReason = s.endReason;
    if (status === "ACTIVE" || status === "PAUSED") return "active";
    if (status === "PENDING") return "pending";
    if (status === "ENDED") return "ended";
    if (status === "REJECTED")
      return endReason === "timeout" ? "missed" : "declined";
    return "ended";
  };

  const counts = useMemo(() => {
    const map: Record<Tab, number> = {
      all: list.length,
      active: 0,
      pending: 0,
      missed: 0,
      declined: 0,
      ended: 0,
    };
    list.forEach((s) => {
      map[categorize(s)] += 1;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  const filtered =
    tab === "all" ? list : list.filter((s) => categorize(s) === tab);

  // Client-side pagination — backend returns the full list, we slice.
  // Reset to page 1 whenever the tab flips so the astrologer never
  // lands on an empty page after a filter change.
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [tab]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const astrologerId = Number(user?.id);

  const handleAccept = async (s: any) => {
    startTransition("Starting chat…");
    await accept.mutateAsync({
      sessionId: Number(s.id),
      astrologerId,
    });
    router.push(`/jyotish/astrologer-dashboard/chat/${s.id}`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/jyotish/astrologer-dashboard"
        className="inline-flex items-center gap-1 text-sm text-[var(--jy-text-muted)] hover:text-[var(--jy-accent-gold)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <header>
        <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-[var(--jy-text-primary)]">
          <MessageCircle className="h-6 w-6 text-[var(--jy-accent-gold)]" />
          Requests
        </h1>
        <p className="mt-1 text-sm text-[var(--jy-text-muted)]">
          Every chat request you&rsquo;ve received — live ones you can accept,
          plus missed, declined and completed sessions.
        </p>
      </header>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All", null],
            ["active", "Active", CircleDot],
            ["pending", "Pending", Clock],
            ["missed", "Missed", Hourglass],
            ["declined", "Declined", XCircle],
            ["ended", "Ended", CheckCircle2],
          ] as Array<[Tab, string, any]>
        ).map(([key, label, Icon]) => {
          const on = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                on
                  ? "border-[var(--jy-accent-gold)]/50 bg-[var(--jy-accent-gold)]/15 text-[var(--jy-accent-gold)]"
                  : "border-white/10 bg-white/[0.03] text-[var(--jy-text-secondary)] hover:border-white/20 hover:text-white",
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {label}
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  on
                    ? "bg-[var(--jy-accent-gold)]/25"
                    : "bg-white/5 text-[var(--jy-text-muted)]",
                )}
              >
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] px-4 py-6 text-sm text-[var(--jy-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading requests…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <>
          <ul className="space-y-2">
            {pageItems.map((s) => (
              <RequestRow
                key={s.id}
                s={s}
                category={categorize(s)}
                onAccept={() => handleAccept(s)}
                onReject={() =>
                  reject.mutate({
                    sessionId: Number(s.id),
                    astrologerId,
                    reason: "Unavailable right now",
                  })
                }
                onOpenChat={() =>
                  router.push(`/jyotish/astrologer-dashboard/chat/${s.id}`)
                }
                accepting={accept.isPending}
              />
            ))}
          </ul>
          {totalPages > 1 && (
            // The shared Pagination uses `ghost` buttons that read
            // --text-primary for their label + SVG stroke. On the
            // Jyotish dark canvas that resolves to near-black and the
            // arrows vanish — locally remap the CSS vars to the
            // jyotish palette so buttons stay visible without forking
            // the component.
            <div
              className="pt-2"
              style={{
                ["--text-primary" as any]: "var(--jy-text-primary)",
                ["--text-secondary" as any]: "var(--jy-text-secondary)",
                ["--bg-secondary" as any]: "rgba(255,255,255,0.06)",
                ["--border-focus" as any]: "var(--jy-accent-gold)",
              }}
            >
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const msg: Record<Tab, string> = {
    all: "No chat requests yet. They'll show here when users start reaching out.",
    active: "No active sessions right now.",
    pending: "Nothing pending. New requests will appear within 60 seconds.",
    missed: "No missed requests — you've stayed on top of your queue.",
    declined: "You haven't declined any requests yet.",
    ended: "No completed sessions yet.",
  };
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--jy-accent-gold)]/10 text-[var(--jy-accent-gold)]">
        <MessageCircle className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-[var(--jy-text-primary)]">
        Nothing here
      </p>
      <p className="mt-1 text-xs text-[var(--jy-text-muted)]">{msg[tab]}</p>
    </div>
  );
}

function RequestRow({
  s,
  category,
  onAccept,
  onReject,
  onOpenChat,
  accepting,
}: {
  s: any;
  category: Tab;
  onAccept: () => void;
  onReject: () => void;
  onOpenChat: () => void;
  accepting: boolean;
}) {
  const name =
    s.userName ??
    s.user?.name ??
    s.user?.fullName ??
    `User #${s.userId}`;
  const img = s.user?.avatar || s.user?.profileImage;
  const src = img ? resolveAssetUrl(img) || img : "";
  const requestedIso = s.requestedAt ?? s.createdAt;

  const chip =
    category === "active"
      ? {
          label: "Active",
          cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        }
      : category === "pending"
        ? {
            label: "Pending",
            cls: "border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/10 text-[var(--jy-accent-gold)]",
          }
        : category === "missed"
          ? {
              label: "Missed",
              cls: "border-red-500/30 bg-red-500/10 text-red-300",
            }
          : category === "declined"
            ? {
                label: "Declined",
                cls: "border-red-500/30 bg-red-500/10 text-red-300",
              }
            : {
                label: "Ended",
                cls: "border-white/10 bg-white/5 text-[var(--jy-text-muted)]",
              };

  return (
    <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-[var(--jy-bg-card)] px-4 py-3">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[var(--jy-accent-purple)]/20">
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--jy-accent-gold)]">
            <User className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--jy-text-primary)]">
          {name}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--jy-text-muted)]">
          Requested{" "}
          {requestedIso
            ? new Date(requestedIso).toLocaleString([], {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
          {s.pricePerMinute > 0 && (
            <>
              {" "}· ₹{Number(s.pricePerMinute).toLocaleString()} / min
            </>
          )}
          {category === "ended" && s.minutesBilled ? (
            <> · {s.minutesBilled} min</>
          ) : null}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            chip.cls,
          )}
        >
          {chip.label}
        </span>
        {category === "pending" && (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onAccept}
              disabled={accepting}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3 w-3" /> Accept
            </button>
            <button
              type="button"
              onClick={onReject}
              className="inline-flex items-center gap-1 rounded-lg bg-red-500/20 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/30"
            >
              <XCircle className="h-3 w-3" /> Reject
            </button>
          </div>
        )}
        {category === "active" && (
          <button
            type="button"
            onClick={onOpenChat}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20"
          >
            Open chat
          </button>
        )}
      </div>
    </li>
  );
}
