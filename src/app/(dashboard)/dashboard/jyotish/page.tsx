"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Star, ArrowRight, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMyChatHistory } from "@/services/jyotish/sessions";
import { useWalletBalance } from "@/services/wallet";
import { usePrice } from "@/hooks/usePrice";
import { JyotishSubNav } from "@/components/user/JyotishSubNav";
import { ReviewModal } from "@/components/jyotish/chat/ReviewModal";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { cn } from "@/lib/utils";

const statusCls: Record<string, string> = {
  ENDED: "bg-emerald-500/15 text-emerald-400",
  REJECTED: "bg-red-500/15 text-red-400",
};

/**
 * Shopper's consultation history. Pulls from
 * `GET /jyotish/chat/my-history?userId=X` which returns ENDED sessions
 * with their astrologer summary + any attached review. Un-reviewed
 * ENDED sessions get a "Rate session" CTA that opens the same
 * ReviewModal the chat-end flow surfaces.
 */
export default function UserJyotishPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useMyChatHistory(user?.id);
  const { data: walletData } = useWalletBalance();
  const { format } = usePrice();
  const [reviewFor, setReviewFor] = useState<any | null>(null);

  const list: Array<any> = (data ?? []) as Array<any>;
  const walletBalance = Number(
    (walletData as { balance?: number | string } | undefined)?.balance ?? 0,
  );

  const totals = useMemo(() => {
    return list.reduce(
      (acc, s) => {
        acc.spent += Number(s.totalCharged ?? 0);
        return acc;
      },
      { spent: 0 },
    );
  }, [list]);

  return (
    <div>
      <JyotishSubNav />
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            My Jyotish Consultations
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Every chat you&rsquo;ve had with an astrologer, with duration and what you paid.
          </p>
        </div>
        <Link
          href="/jyotish/consult-now"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          Book Consultation <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Consultations" value={list.length.toLocaleString()} />
        <StatCard label="Wallet Balance" value={format(walletBalance)} />
        <StatCard
          label="Total Spent"
          value={format(totals.spent)}
          accent
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl shimmer" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-12 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            No consultations yet. Book one to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[var(--bg-secondary)] text-left">
                <tr>
                  {[
                    "Astrologer",
                    "Date",
                    "Duration",
                    "Paid",
                    "Status",
                    "Review",
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {list.map((s) => (
                  <ConsultationRow
                    key={s.id}
                    s={s}
                    format={format}
                    onRate={() => setReviewFor(s)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ReviewModal
        open={!!reviewFor}
        session={reviewFor}
        onClose={() => setReviewFor(null)}
        /* History-view reviews are optional — the shopper can dismiss;
           the mandatory variant lives on the chat page at session end. */
        mandatory={false}
      />
    </div>
  );
}

function ConsultationRow({
  s,
  format,
  onRate,
}: {
  s: any;
  format: (n: number) => string;
  onRate: () => void;
}) {
  const astro = s.astrologer ?? {};
  const name = astro.displayName ?? astro.fullName ?? "Astrologer";
  const imgRaw = astro.profile?.image ?? astro.profileImage;
  const src = imgRaw ? resolveAssetUrl(imgRaw) || imgRaw : "";
  const seconds = Number(s.secondsBilled ?? s.minutesBilled * 60 ?? 0);
  const status = String(s.status ?? "").toUpperCase();
  const paid = Number(s.totalCharged ?? 0);
  const freeMinutes = Number(s.freeMinutesGranted ?? 0);
  const freeSeconds = Math.min(freeMinutes * 60, seconds);
  const isFree = paid <= 0;
  const when = s.endedAt ? new Date(s.endedAt) : null;
  const review = s.review;
  const canReview = status === "ENDED" && !review;

  return (
    <tr className="hover:bg-[var(--bg-card-hover)]">
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
            {src ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={src} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[var(--accent-primary)]">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
          <p className="truncate font-semibold text-[var(--text-primary)]">
            {name}
          </p>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">
        {when
          ? when.toLocaleString([], {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 font-mono text-[var(--text-secondary)]">
        <div>{formatDuration(seconds)}</div>
        {freeMinutes > 0 && (
          <div className="mt-0.5 font-sans text-[10px] text-emerald-500">
            incl. {formatDuration(freeSeconds)} free
          </div>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {isFree ? (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Free
          </span>
        ) : (
          format(paid)
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            statusCls[status] || "bg-[var(--bg-secondary)] text-[var(--text-muted)]",
          )}
        >
          {status.toLowerCase()}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {review ? (
          <div className="inline-flex items-center gap-1 text-[var(--jy-accent-gold)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i < review.rating ? "fill-current" : "opacity-30",
                )}
              />
            ))}
          </div>
        ) : canReview ? (
          <button
            type="button"
            onClick={onRate}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-primary)] px-2.5 py-1 text-[11px] font-semibold text-white hover:brightness-110"
          >
            <Star className="h-3 w-3" /> Rate session
          </button>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">—</span>
        )}
      </td>
    </tr>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-2xl font-bold",
          accent ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]",
        )}
      >
        {value}
      </p>
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
