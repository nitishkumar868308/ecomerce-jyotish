"use client";

import React from "react";
import { useJyotishChatSessions } from "@/services/jyotish/sessions";
import { useAstrologerWallet } from "@/services/jyotish/wallet";

export function AstrologerStats() {
  const { data: sessions } = useJyotishChatSessions();
  const { data: wallet } = useAstrologerWallet();

  const totalSessions = (sessions ?? []).length;
  const activeSessions = (sessions ?? []).filter(
    (s: any) => s.status === "active",
  ).length;
  const balance = wallet?.balance ?? 0;

  const stats = [
    {
      label: "Total Sessions",
      value: totalSessions,
      color: "from-[var(--jy-accent-gold)] to-amber-500",
    },
    {
      label: "Active Now",
      value: activeSessions,
      color: "from-green-400 to-emerald-500",
    },
    {
      label: "Wallet Balance",
      value: `\u20B9${balance.toLocaleString()}`,
      color: "from-[var(--jy-accent-purple)] to-[var(--jy-accent-purple-light)]",
    },
    {
      label: "This Month",
      value: (sessions ?? []).filter((s: any) => {
        const d = new Date(s.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length,
      color: "from-cyan-400 to-blue-500",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {s.label}
          </p>
          <p
            className={`mt-2 bg-gradient-to-r ${s.color} bg-clip-text text-2xl font-bold text-transparent`}
          >
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export default AstrologerStats;
