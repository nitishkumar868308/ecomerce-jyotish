"use client";

import React from "react";
import Link from "next/link";
import { useJyotishChatSessions } from "@/services/jyotish/sessions";

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-400",
  completed: "bg-blue-500/10 text-blue-400",
  cancelled: "bg-red-500/10 text-red-400",
  pending: "bg-yellow-500/10 text-yellow-400",
};

export function SessionHistory() {
  const { data: sessions, isLoading } = useJyotishChatSessions();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl shimmer" />
        ))}
      </div>
    );
  }

  const list = sessions ?? [];

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
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              User
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Date
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Duration
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Status
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-primary)]">
          {list.map((s: any) => (
            <tr key={s._id || s.id} className="hover:bg-[var(--bg-card-hover)]">
              <td className="whitespace-nowrap px-4 py-3 font-medium">
                {s.userName || "User"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">
                {s.createdAt
                  ? new Date(s.createdAt).toLocaleDateString()
                  : "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">
                {s.duration ? `${s.duration} min` : "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusColors[s.status] || "bg-gray-500/10 text-gray-400"
                  }`}
                >
                  {s.status || "unknown"}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {s.status === "active" ? (
                  <Link
                    href={`/jyotish/astrologer-dashboard/chat/${s._id || s.id}`}
                    className="text-xs font-medium text-[var(--jy-accent-gold)] hover:underline"
                  >
                    Open Chat
                  </Link>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">--</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SessionHistory;
