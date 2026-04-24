"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useJyotishChatSessions } from "@/services/jyotish/sessions";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePrice } from "@/hooks/usePrice";
import type { ChatSession } from "@/types/jyotish";

// Dashboard preview cap — the full ledger lives on the Transactions
// page, so this widget is just a 5-row teaser with a "Show all" link.
const RECENT_LIMIT = 5;

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-400",
  ENDED: "bg-blue-500/10 text-blue-400",
  PENDING: "bg-yellow-500/10 text-yellow-400",
  active: "bg-green-500/10 text-green-400",
  completed: "bg-blue-500/10 text-blue-400",
  cancelled: "bg-red-500/10 text-red-400",
  pending: "bg-yellow-500/10 text-yellow-400",
};

export function SessionHistory() {
  const { user } = useAuthStore();
  const { data: sessions, isLoading } = useJyotishChatSessions(user?.id);
  const { format } = usePrice();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl shimmer" />
        ))}
      </div>
    );
  }

  const list = (sessions ?? []) as ChatSession[];
  const preview = list.slice(0, RECENT_LIMIT);
  const hasMore = list.length > RECENT_LIMIT;

  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm py-12 text-center">
        <p className="text-sm text-[var(--jy-text-muted)]">No sessions yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            {["User", "Date", "Duration", "Gross", "GST", "You earn", "Status", "Action"].map(
              (h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--jy-text-muted)]"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {preview.map((s) => {
            const gross = s.grossAmount ?? s.totalAmount ?? 0;
            const gst = s.gstAmount ?? 0;
            const earn = s.astrologerAmount ?? 0;
            const status = String(s.status ?? "unknown");
            return (
              <tr
                key={s.id}
                className="transition-colors hover:bg-white/[0.04]"
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium">
                  {s.user?.name ?? "User"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--jy-text-secondary)]">
                  {(() => {
                    const iso = s.requestedAt ?? s.createdAt;
                    return iso ? new Date(iso).toLocaleDateString() : "-";
                  })()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--jy-text-secondary)]">
                  {s.duration ? `${s.duration} min` : "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--jy-text-secondary)]">
                  {gross > 0 ? format(gross) : "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--jy-text-secondary)]">
                  {gst > 0 ? format(gst) : "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-[var(--jy-accent-gold)]">
                  {earn > 0 ? format(earn) : "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      statusColors[status] || "bg-gray-500/10 text-gray-400"
                    }`}
                  >
                    {status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {(status === "ACTIVE" || status === "active") ? (
                    <Link
                      href={`/jyotish/astrologer-dashboard/chat/${s.id}`}
                      className="text-xs font-medium text-[var(--jy-accent-gold)] hover:underline"
                    >
                      Open Chat
                    </Link>
                  ) : (
                    <span className="text-xs text-[var(--jy-text-muted)]">--</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      <Link
        href="/jyotish/astrologer-dashboard/transactions"
        className="flex items-center justify-center gap-1.5 border-t border-white/10 bg-white/[0.02] px-4 py-2.5 text-xs font-semibold text-[var(--jy-accent-gold)] transition-colors hover:bg-white/[0.05]"
      >
        {hasMore ? `Show all (${list.length})` : "Show all"}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export default SessionHistory;
