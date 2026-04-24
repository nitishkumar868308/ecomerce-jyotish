"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  User,
  Wallet,
  TrendingUp,
  Percent,
  Receipt,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAstrologerEarnings } from "@/services/jyotish/sessions";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 10;

/**
 * Astrologer earnings ledger. One row per completed session:
 *   User · Duration · Free/Paid · Gross · GST · Your share · Admin share
 *
 * Totals footer sums everything at the bottom so the astrologer can
 * see what's coming in without reaching for a calculator. GST is
 * shown explicitly (before the user→astro split is computed) because
 * that's how payouts are reported in the dashboard settlement view.
 */
export default function AstrologerTransactionsPage() {
  const { user } = useAuthStore();
  const { data: rows, isLoading } = useAstrologerEarnings(user?.id);
  const list = (rows ?? []) as Array<any>;

  const totals = useMemo(() => {
    return list.reduce(
      (acc, s) => {
        acc.gross += Number(s.totalCharged ?? 0);
        acc.gst += Number(s.gstAmount ?? 0);
        acc.astro += Number(s.astrologerEarning ?? 0);
        acc.admin += Number(s.adminEarning ?? 0);
        acc.seconds += Number(s.secondsBilled ?? s.minutesBilled * 60 ?? 0);
        acc.count += 1;
        return acc;
      },
      { gross: 0, gst: 0, astro: 0, admin: 0, seconds: 0, count: 0 },
    );
  }, [list]);

  // Paginate the ledger — 10 rows/page feels right for the settlement
  // view without crowding KPIs off-screen.
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [list, page],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/jyotish/astrologer-dashboard"
        className="inline-flex items-center gap-1 text-sm text-[var(--jy-text-muted)] hover:text-[var(--jy-accent-gold)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <header>
        <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-[var(--jy-text-primary)]">
          <Wallet className="h-6 w-6 text-[var(--jy-accent-gold)]" />
          Transactions
        </h1>
        <p className="mt-1 text-sm text-[var(--jy-text-muted)]">
          One row per completed consultation. GST is deducted first, then the
          rest is split between you and the platform per your configured share.
        </p>
      </header>

      {/* Totals strip */}
      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard
          label="Sessions"
          value={totals.count.toLocaleString()}
          icon={<Receipt className="h-4 w-4" />}
        />
        <KpiCard
          label="Gross billed"
          value={`₹${totals.gross.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          label="GST collected"
          value={`₹${totals.gst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
          icon={<Percent className="h-4 w-4" />}
        />
        <KpiCard
          label="Your earnings"
          value={`₹${totals.astro.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
          icon={<Wallet className="h-4 w-4" />}
          accent
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] px-4 py-6 text-sm text-[var(--jy-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading transactions…
        </div>
      ) : list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--jy-bg-card)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-white/[0.03] text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--jy-text-muted)]">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3 text-right">Gross</th>
                  <th className="px-4 py-3 text-right">GST</th>
                  <th className="px-4 py-3 text-right">Your share</th>
                  <th className="px-4 py-3 text-right">Admin share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pageItems.map((s) => (
                  <TransactionRow key={s.id} s={s} />
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            // Remap the Pagination's text-color vars to the jyotish
            // palette — the shared ghost buttons would otherwise use
            // --text-primary (near-black) and disappear on this dark
            // canvas.
            <div
              className="border-t border-white/5 px-4 py-3"
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
        </div>
      )}
    </div>
  );
}

function TransactionRow({ s }: { s: any }) {
  const name = s.user?.name ?? `User #${s.userId}`;
  const img = s.user?.profileImage;
  const src = img ? resolveAssetUrl(img) || img : "";
  const perMin = Number(s.pricePerMinute ?? 0);
  const seconds = Number(s.secondsBilled ?? s.minutesBilled * 60 ?? 0);
  const gross = Number(s.totalCharged ?? 0);
  const gst = Number(s.gstAmount ?? 0);
  const astro = Number(s.astrologerEarning ?? 0);
  const admin = Number(s.adminEarning ?? 0);
  const freeMinutes = Number(s.freeMinutesGranted ?? 0);
  const freeSeconds = Math.min(freeMinutes * 60, seconds);
  const paidSeconds = Math.max(0, seconds - freeSeconds);
  const isFullyFree = perMin <= 0 || (freeMinutes > 0 && paidSeconds === 0);
  const when = s.endedAt ? new Date(s.endedAt) : null;

  return (
    <tr className="transition-colors hover:bg-white/[0.02]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[var(--jy-accent-purple)]/20">
            {src ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={src} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[var(--jy-accent-gold)]">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--jy-text-primary)]">
              {name}
            </p>
            {when && (
              <p className="text-[11px] text-[var(--jy-text-muted)]">
                {when.toLocaleString([], {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-[var(--jy-text-primary)]">
        <div>{formatDuration(seconds)}</div>
        {freeMinutes > 0 && (
          <div className="mt-0.5 text-[10px] font-sans text-emerald-300">
            incl. {formatDuration(freeSeconds)} free
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {isFullyFree ? (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            Free offer
          </span>
        ) : (
          <span className="text-[var(--jy-text-secondary)]">₹{perMin}/min</span>
        )}
      </td>
      <td className="px-4 py-3 text-right font-mono text-[var(--jy-text-primary)]">
        ₹{gross.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-3 text-right font-mono text-[var(--jy-text-muted)]">
        ₹{gst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--jy-accent-gold)]">
        ₹{astro.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-3 text-right font-mono text-[var(--jy-text-muted)]">
        ₹{admin.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </td>
    </tr>
  );
}

function KpiCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-2xl border px-4 py-3 " +
        (accent
          ? "border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/10"
          : "border-white/10 bg-[var(--jy-bg-card)]")
      }
    >
      <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--jy-text-muted)]">
        {icon}
        {label}
      </p>
      <p
        className={
          "mt-1 text-xl font-bold " +
          (accent
            ? "text-[var(--jy-accent-gold)]"
            : "text-[var(--jy-text-primary)]")
        }
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--jy-accent-gold)]/10 text-[var(--jy-accent-gold)]">
        <Receipt className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-[var(--jy-text-primary)]">
        No transactions yet
      </p>
      <p className="mt-1 text-xs text-[var(--jy-text-muted)]">
        Your earnings will appear here after your first completed consultation.
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
