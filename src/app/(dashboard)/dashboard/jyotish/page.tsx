"use client";

import Link from "next/link";
import { Star, ArrowRight } from "lucide-react";
import { useJyotishChatSessions } from "@/services/jyotish/sessions";
import { usePrice } from "@/hooks/usePrice";
import type { ChatSession } from "@/types/jyotish";

const statusCls: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-400",
  ENDED: "bg-blue-500/10 text-blue-400",
  PENDING: "bg-yellow-500/10 text-yellow-400",
  active: "bg-green-500/10 text-green-400",
  completed: "bg-blue-500/10 text-blue-400",
  pending: "bg-yellow-500/10 text-yellow-400",
};

export default function UserJyotishPage() {
  const { data, isLoading } = useJyotishChatSessions();
  const { format } = usePrice();

  const list: ChatSession[] = (data ?? []) as ChatSession[];
  const totalSpent = list.reduce(
    (acc, s) => acc + Number(s.grossAmount ?? s.totalAmount ?? 0),
    0,
  );
  const totalSessions = list.length;
  const activeSessions = list.filter(
    (s) => String(s.status ?? "").toUpperCase() === "ACTIVE",
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            My Jyotish Consultations
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Your chat sessions with astrologers.
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
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Total Consultations
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--accent-primary)]">
            {totalSessions}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Active Now
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--accent-primary)]">
            {activeSessions}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Total Spent
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--accent-primary)]">
            {format(totalSpent)}
          </p>
        </div>
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
        <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-secondary)] text-left">
              <tr>
                {["Astrologer", "Date", "Duration", "Amount", "Status", "Action"].map(
                  (h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
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
                const status = String(s.status ?? "unknown");
                const up = status.toUpperCase();
                return (
                  <tr key={s.id} className="hover:bg-[var(--bg-card-hover)]">
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-[var(--jy-accent-gold)]" />
                        {s.astrologer?.name ?? "Astrologer"}
                      </div>
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
                      {gross > 0 ? format(gross) : "Free"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusCls[status] || "bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {up === "ACTIVE" ? (
                        <Link
                          href={`/jyotish/chat/${s.id}`}
                          className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
                        >
                          Resume Chat
                        </Link>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
