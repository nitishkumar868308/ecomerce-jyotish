"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  History,
  ArrowUpRight,
  MessageCircle,
  Megaphone,
  UserCircle2,
  Gift,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAstrologerProfile } from "@/services/jyotish/profile";
import { AstrologerStats } from "@/components/jyotish/dashboard/AstrologerStats";
import { SessionHistory } from "@/components/jyotish/dashboard/SessionHistory";
import { StatusBanner } from "@/components/jyotish/dashboard/StatusBanner";
import { PendingChatRequests } from "@/components/jyotish/dashboard/PendingChatRequests";

/**
 * Dashboard home. Sits inside the polished panel layout — no chrome
 * of its own, just composition of hero + shortcuts + stats + history.
 * Responsive grid so everything stacks on phones and spreads across
 * columns on desktop.
 */
export default function AstrologerDashboardPage() {
  const { user } = useAuthStore();
  const { data: astrologer } = useAstrologerProfile(user?.id ?? "");
  const firstName = user?.name?.split(" ")[0] ?? "Astrologer";

  return (
    <div className="space-y-7 sm:space-y-9">
      {astrologer && <StatusBanner astrologer={astrologer} />}

      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[var(--jy-accent-purple)]/25 via-[#15102a]/60 to-[var(--jy-accent-gold)]/15 p-6 shadow-xl sm:p-9">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[var(--jy-accent-gold)]/25 blur-3xl" />
          <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-[var(--jy-accent-purple)]/30 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--jy-accent-gold)]">
              <Sparkles className="h-3 w-3" /> Your panel
            </p>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-[var(--jy-text-primary)] sm:text-3xl">
              Namaste, {firstName} <span className="text-[var(--jy-accent-gold)]">✦</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--jy-text-secondary)] sm:text-base">
              Here&rsquo;s a quick snapshot of your consultations today. Check
              in, take pending requests and review how last week played out.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
            <Link
              href="/jyotish/astrologer-dashboard/profile"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--jy-accent-gold)] px-4 py-2 text-xs font-semibold text-[var(--jy-bg-primary)] shadow-md shadow-[var(--jy-accent-gold)]/30 hover:brightness-110"
            >
              <UserCircle2 className="h-4 w-4" />
              View profile
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/jyotish/astrologer-dashboard/admin-chat"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-[var(--jy-text-primary)] hover:border-[var(--jy-accent-gold)]/40 hover:bg-white/10"
            >
              <MessageCircle className="h-4 w-4" />
              Message admin
            </Link>
          </div>
        </div>
      </section>

      {/* ── Shortcuts row ── */}
      <section>
        <SectionHeading icon={<Sparkles className="h-3.5 w-3.5" />}>
          Quick actions
        </SectionHeading>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ShortcutCard
            href="/jyotish/astrologer-dashboard/profile"
            label="My profile"
            hint="Edit requests + documents"
            Icon={UserCircle2}
            accent="gold"
          />
          <ShortcutCard
            href="/jyotish/astrologer-dashboard/ad-campaigns"
            label="Ad campaigns"
            hint="Promote your listing"
            Icon={Megaphone}
            accent="purple"
          />
          <ShortcutCard
            href="/jyotish/astrologer-dashboard/free-sessions"
            label="Free sessions"
            hint="Active offers"
            Icon={Gift}
            accent="gold"
          />
          <ShortcutCard
            href="/jyotish/astrologer-dashboard/admin-chat"
            label="Chat with admin"
            hint="Support & approvals"
            Icon={MessageCircle}
            accent="purple"
          />
        </div>
      </section>

      {/* ── Pending chat requests ── */}
      <PendingChatRequests />

      {/* ── Stats ── */}
      <section>
        <SectionHeading icon={<TrendingUp className="h-3.5 w-3.5" />}>
          At a glance
        </SectionHeading>
        <div className="mt-3">
          <AstrologerStats />
        </div>
      </section>

      {/* ── Sessions ── */}
      <section>
        <SectionHeading icon={<History className="h-3.5 w-3.5" />}>
          Recent sessions
        </SectionHeading>
        <div className="mt-3">
          <SessionHistory />
        </div>
      </section>
    </div>
  );
}

/* ──────────────────── bits ──────────────────── */

function SectionHeading({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2 className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--jy-accent-gold)]">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--jy-accent-gold)]/15">
        {icon}
      </span>
      {children}
    </h2>
  );
}

function ShortcutCard({
  href,
  label,
  hint,
  Icon,
  accent,
}: {
  href: string;
  label: string;
  hint: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: "gold" | "purple";
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-[var(--jy-accent-gold)]/30 hover:bg-white/[0.05]"
    >
      <div className="flex items-center gap-3">
        <span
          className={
            accent === "gold"
              ? "inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--jy-accent-gold)]/15 text-[var(--jy-accent-gold)]"
              : "inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--jy-accent-purple)]/20 text-[var(--jy-accent-purple-light)]"
          }
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--jy-text-primary)]">
            {label}
          </p>
          <p className="truncate text-[11px] text-[var(--jy-text-muted)]">
            {hint}
          </p>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--jy-text-muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--jy-accent-gold)]" />
      </div>
    </Link>
  );
}
