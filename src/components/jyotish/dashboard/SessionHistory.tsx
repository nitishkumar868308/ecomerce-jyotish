"use client";

import React from "react";
import Link from "next/link";
import { useJyotishChatSessions } from "@/services/jyotish/sessions";
import { usePrice } from "@/hooks/usePrice";
import type { ChatSession } from "@/types/jyotish";

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
  const { data: sessions, isLoading } = useJyotishChatSessions();
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

  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-12 text-center">
        <p className="text-sm text-[var(--text-muted)]">No sessions yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
            {["User", "Date", "Duration", "Gross", "GST", "You earn", "Status", "Action"].map(
              (h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-primary)]">
          {list.map((s) => {
            const gross = s.grossAmount ?? s.totalAmount ?? 0;
            const gst = s.gstAmount ?? 0;
            const earn = s.astrologerAmount ?? 0;
            const status = String(s.status ?? "unknown");
            return (
              <tr
                key={s.id}
                className="hover:bg-[var(--bg-card-hover)]"
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium">
                  {s.user?.name ?? "User"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">
                  {s.createdAt
                    ? new Date(s.createdAt).toLocaleDateString()
                    : "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">
                  {s.duration ? `${s.duration} min` : "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">
                  {gross > 0 ? format(gross) : "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">
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
                    <span className="text-xs text-[var(--text-muted)]">--</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default SessionHistory;
