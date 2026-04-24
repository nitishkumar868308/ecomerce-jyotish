"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  User,
  Wallet,
  TrendingUp,
  Percent,
  Receipt,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAdminJyotishTransactions } from "@/services/jyotish/sessions";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 10;

/**
 * Admin-wide Jyotish transactions ledger. One row per completed chat
 * session across every astrologer, sorted newest-first. Powers the
 * GST + astro + admin reconciliation view — each column is the same
 * number the astrologer sees on their own Transactions page, so
 * settlement conversations line up exactly.
 *
 * Search filters by user or astrologer name (client-side because the
 * endpoint already caps at 200 rows).
 */
export default function AdminJyotishTransactionsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminJyotishTransactions({ limit: 200 });
  const list = (data ?? []) as Array<any>;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => {
      const userName = (s.user?.name ?? "").toLowerCase();
      const astroName = (
        s.astrologer?.displayName ??
        s.astrologer?.fullName ??
        ""
      ).toLowerCase();
      return userName.includes(q) || astroName.includes(q);
    });
  }, [list, search]);

  // Client-side pagination over the filtered list so a busy panel
  // stays scannable. Reset to page 1 when the search query changes.
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, s) => {
        acc.gross += Number(s.totalCharged ?? 0);
        acc.gst += Number(s.gstAmount ?? 0);
        acc.astro += Number(s.astrologerEarning ?? 0);
        acc.admin += Number(s.adminEarning ?? 0);
        return acc;
      },
      { gross: 0, gst: 0, astro: 0, admin: 0 },
    );
  }, [filtered]);

  return (
    <div>
      <PageHeader
        title="Jyotish Transactions"
        description="Every completed consultation across the panel — GST, astrologer and platform shares broken out per session."
      />

      {/* Totals strip */}
      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <KpiCard
          label="Sessions"
          value={filtered.length.toLocaleString()}
          icon={<Receipt className="h-4 w-4" />}
        />
        <KpiCard
          label="Gross billed"
          value={`₹${totals.gross.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          label="GST"
          value={`₹${totals.gst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
          icon={<Percent className="h-4 w-4" />}
        />
        <KpiCard
          label="Platform share"
          value={`₹${totals.admin.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
          icon={<Wallet className="h-4 w-4" />}
          accent
        />
      </div>

      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user or astrologer…"
            className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--accent-primary)]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-6 text-sm text-[var(--text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading transactions…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-[var(--bg-secondary)] text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Astrologer</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3 text-right">Gross</th>
                  <th className="px-4 py-3 text-right">GST</th>
                  <th className="px-4 py-3 text-right">Astro</th>
                  <th className="px-4 py-3 text-right">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {pageItems.map((s) => (
                  <AdminRow key={s.id} s={s} />
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="border-t border-[var(--border-primary)] px-4 py-3">
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

function AdminRow({ s }: { s: any }) {
  const userName = s.user?.name ?? `User #${s.userId}`;
  const userImg = s.user?.profileImage;
  const userSrc = userImg ? resolveAssetUrl(userImg) || userImg : "";
  const astroName =
    s.astrologer?.displayName ?? s.astrologer?.fullName ?? `Astro #${s.astrologerId}`;
  const perMin = Number(s.pricePerMinute ?? 0);
  const seconds = Number(s.secondsBilled ?? s.minutesBilled * 60 ?? 0);
  const gross = Number(s.totalCharged ?? 0);
  const gst = Number(s.gstAmount ?? 0);
  const astro = Number(s.astrologerEarning ?? 0);
  const admin = Number(s.adminEarning ?? 0);
  const freeMinutes = Number(s.freeMinutesGranted ?? 0);
  const freeSeconds = Math.min(freeMinutes * 60, seconds);
  const when = s.endedAt ? new Date(s.endedAt) : null;

  return (
    <tr className="transition-colors hover:bg-[var(--bg-secondary)]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
            {userSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={userSrc}
                alt={userName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[var(--accent-primary)]">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--text-primary)]">
              {userName}
            </p>
            {when && (
              <p className="text-[11px] text-[var(--text-muted)]">
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
      <td className="px-4 py-3 text-[var(--text-primary)]">{astroName}</td>
      <td className="px-4 py-3 font-mono text-[var(--text-primary)]">
        <div>{formatDuration(seconds)}</div>
        {freeMinutes > 0 && (
          <div className="mt-0.5 font-sans text-[10px] text-emerald-500">
            incl. {formatDuration(freeSeconds)} free
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-[var(--text-secondary)]">
        {perMin > 0 ? `₹${perMin}/min` : "Free"}
      </td>
      <td className="px-4 py-3 text-right font-mono text-[var(--text-primary)]">
        ₹{gross.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-3 text-right font-mono text-[var(--text-muted)]">
        ₹{gst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--text-primary)]">
        ₹{astro.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--accent-primary)]">
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
          ? "border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10"
          : "border-[var(--border-primary)] bg-[var(--bg-card)]")
      }
    >
      <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {icon}
        {label}
      </p>
      <p
        className={
          "mt-1 text-xl font-bold " +
          (accent ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]")
        }
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-card)] px-6 py-10 text-center">
      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
        <Receipt className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        No completed sessions yet
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Once astrologers start taking consultations the ledger will populate here.
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
