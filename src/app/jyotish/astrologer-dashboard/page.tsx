"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/useAuthStore";
import { AstrologerStats } from "@/components/jyotish/dashboard/AstrologerStats";
import { SessionHistory } from "@/components/jyotish/dashboard/SessionHistory";

const sideLinks = [
  { href: "/jyotish/astrologer-dashboard", label: "Overview", icon: "\u2302" },
  { href: "/jyotish/astrologer-dashboard/profile", label: "Profile", icon: "\u263A" },
  { href: "/jyotish/astrologer-dashboard/wallet", label: "Wallet", icon: "\u20B9" },
];

export default function AstrologerDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-8 space-y-1">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--jy-accent-purple)]/20 text-sm font-bold text-[var(--jy-accent-purple-light)]">
              {user?.name?.[0] || "A"}
            </div>
            <div>
              <p className="text-sm font-semibold">{user?.name || "Astrologer"}</p>
              <p className="text-xs text-[var(--jy-text-muted)]">Dashboard</p>
            </div>
          </div>
          {sideLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            >
              <span>{l.icon}</span>
              {l.label}
            </Link>
          ))}
          <Link
            href="/jyotish"
            className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--jy-accent-gold)] hover:bg-[var(--jy-accent-gold)]/10"
          >
            <span>&larr;</span> Back to Jyotish
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1">
        <h1 className="mb-6 text-2xl font-bold">Dashboard Overview</h1>
        <AstrologerStats />
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Recent Sessions</h2>
          <SessionHistory />
        </div>
      </div>
    </div>
  );
}
