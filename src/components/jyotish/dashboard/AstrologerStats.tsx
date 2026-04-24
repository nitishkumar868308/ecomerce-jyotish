"use client";

import React from "react";
import {
  Activity,
  Gift,
  Wallet,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import {
  useAstrologerEarnings,
  useAstrologerFreeOfferSummary,
} from "@/services/jyotish/sessions";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * Top-level stats row — 4 cards on desktop, 2-up on tablet, stacked
 * on phone. Each card gets its own icon + gradient accent so the row
 * visually breaks up without shouting.
 *
 *   Total sessions — lifetime ENDED count
 *   Active offer   — live free-offer flag + redemptions so far
 *   Earnings       — lifetime astrologer share across all sessions
 *   This month     — current-month astrologer share
 */
export function AstrologerStats() {
  const { user } = useAuthStore();
  const { data: earnings } = useAstrologerEarnings(user?.id);
  const { data: offerSummary } = useAstrologerFreeOfferSummary(user?.id);

  const list = (earnings ?? []) as Array<{
    astrologerEarning?: number;
    endedAt?: string | null;
  }>;

  const totalSessions = list.length;

  const { totalEarnings, thisMonthEarnings } = React.useMemo(() => {
    const now = new Date();
    let total = 0;
    let month = 0;
    for (const s of list) {
      const earn = Number(s.astrologerEarning ?? 0);
      total += earn;
      if (s.endedAt) {
        const d = new Date(s.endedAt);
        if (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        ) {
          month += earn;
        }
      }
    }
    return { totalEarnings: total, thisMonthEarnings: month };
  }, [list]);

  const hasActiveOffer = !!offerSummary?.activeOffer;
  const freeSessionsGiven = offerSummary?.totalFreeSessions ?? 0;
  const offerMinutes = offerSummary?.activeOffer?.minutesPerSession ?? 0;

  const money = (n: number) =>
    `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const stats: Array<{
    label: string;
    value: string | number;
    sub?: string;
    Icon: LucideIcon;
    accent: string;
    ringGradient: string;
  }> = [
    {
      label: "Total sessions",
      value: totalSessions,
      Icon: Activity,
      accent: "text-[var(--jy-accent-gold)]",
      ringGradient: "from-[var(--jy-accent-gold)]/40 to-amber-500/10",
    },
    {
      label: "Active offer",
      value: hasActiveOffer ? `${freeSessionsGiven} used` : "None",
      sub: hasActiveOffer
        ? `${offerMinutes} min/session · live`
        : "No free offer running",
      Icon: Gift,
      accent: hasActiveOffer ? "text-emerald-300" : "text-[var(--jy-text-muted)]",
      ringGradient: hasActiveOffer
        ? "from-emerald-400/40 to-emerald-600/10"
        : "from-white/10 to-white/[0.02]",
    },
    {
      label: "Earnings",
      value: money(totalEarnings),
      sub: "Lifetime · all completed sessions",
      Icon: Wallet,
      accent: "text-[var(--jy-accent-purple-light)]",
      ringGradient: "from-[var(--jy-accent-purple)]/50 to-indigo-600/15",
    },
    {
      label: "This month",
      value: money(thisMonthEarnings),
      sub: new Date().toLocaleString(undefined, {
        month: "long",
        year: "numeric",
      }),
      Icon: Calendar,
      accent: "text-cyan-300",
      ringGradient: "from-cyan-400/40 to-blue-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, sub, Icon, accent, ringGradient }) => (
        <div
          key={label}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f0a24]/70 p-5 backdrop-blur-sm transition-colors hover:border-white/20"
        >
          <div
            className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${ringGradient} blur-2xl opacity-70`}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--jy-text-muted)]">
                {label}
              </p>
              <p className={`mt-2 truncate text-2xl font-bold ${accent}`}>
                {value}
              </p>
              {sub && (
                <p className="mt-1 truncate text-[11px] text-[var(--jy-text-muted)]">
                  {sub}
                </p>
              )}
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[var(--jy-text-secondary)] transition-colors group-hover:bg-white/10">
              <Icon className={`h-5 w-5 ${accent}`} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AstrologerStats;
