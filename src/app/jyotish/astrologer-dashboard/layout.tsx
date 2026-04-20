"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UserCircle2,
  Megaphone,
  MessageCircle,
  Gift,
  Bell,
  LogOut,
  Menu,
  X,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAstrologerProfile } from "@/services/jyotish/profile";
import { cn } from "@/lib/utils";
import { CelestialBackground } from "@/components/jyotish/ui/CelestialBackground";
import { NotificationBell } from "@/components/jyotish/dashboard/NotificationBell";

/**
 * Shared chrome for every page under /jyotish/astrologer-dashboard.
 *
 * - Dedicated jyotish-themed header with profile + notifications + logout.
 * - Sticky sidebar on lg+, slide-in sheet on mobile.
 * - Body is wrapped in CelestialBackground so every sub-page inherits the
 *   jyotish look without having to remember to add it.
 */
const NAV = [
  {
    href: "/jyotish/astrologer-dashboard",
    label: "Overview",
    Icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/jyotish/astrologer-dashboard/profile",
    label: "Profile",
    Icon: UserCircle2,
  },
  {
    href: "/jyotish/astrologer-dashboard/ad-campaigns",
    label: "Ad Campaigns",
    Icon: Megaphone,
  },
  {
    href: "/jyotish/astrologer-dashboard/free-sessions",
    label: "Free Sessions",
    Icon: Gift,
  },
  {
    href: "/jyotish/astrologer-dashboard/admin-chat",
    label: "Chat with Admin",
    Icon: MessageCircle,
  },
];

export default function AstrologerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data: astrologer } = useAstrologerProfile(user?.id ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);

  const firstName = user?.name?.split(" ")[0] ?? "Astrologer";

  return (
    <div className="min-h-screen bg-[var(--jy-bg-primary)] text-[var(--jy-text-primary)]">
      <CelestialBackground className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-white/5 bg-[var(--jy-bg-primary)]/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[var(--jy-text-secondary)] hover:bg-white/5 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <Link
              href="/jyotish"
              className="inline-flex items-center gap-2 text-[var(--jy-accent-gold)]"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-widest">
                Jyotish
              </span>
            </Link>

            <span className="hidden text-xs uppercase tracking-[0.25em] text-[var(--jy-text-muted)] sm:inline">
              / Astrologer
            </span>

            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <Link
                href="/jyotish/astrologer-dashboard/profile"
                className="hidden items-center gap-2 rounded-full border border-white/10 px-2.5 py-1 text-xs text-[var(--jy-text-secondary)] hover:bg-white/5 sm:inline-flex"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--jy-accent-gold)]/20 text-[10px] font-bold text-[var(--jy-accent-gold)]">
                  {firstName[0]?.toUpperCase()}
                </span>
                {firstName}
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/login-jyotish");
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[var(--jy-text-secondary)] hover:bg-red-500/10 hover:text-red-400"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
          {/* Desktop sidebar */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-24 space-y-4">
              <ProfileCard
                name={user?.name ?? "Astrologer"}
                email={user?.email ?? ""}
                status={astrologer?.status}
                commissionPercent={astrologer?.commissionPercent}
              />
              <SideNav pathname={pathname} />
              <Link
                href="/jyotish"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--jy-text-secondary)] hover:bg-white/10"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Jyotish
              </Link>
            </div>
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 w-[82%] max-w-xs overflow-y-auto border-r border-white/10 bg-[var(--jy-bg-primary)] p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-[var(--jy-accent-gold)]">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-bold uppercase tracking-widest">
                    Jyotish
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1.5 text-[var(--jy-text-secondary)] hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ProfileCard
                name={user?.name ?? "Astrologer"}
                email={user?.email ?? ""}
                status={astrologer?.status}
                commissionPercent={astrologer?.commissionPercent}
              />
              <div className="mt-4" />
              <SideNav
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
              <Link
                href="/jyotish"
                onClick={() => setMobileOpen(false)}
                className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--jy-text-secondary)] hover:bg-white/10"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Jyotish
              </Link>
            </aside>
          </div>
        )}
      </CelestialBackground>
    </div>
  );
}

function ProfileCard({
  name,
  email,
  status,
  commissionPercent,
}: {
  name: string;
  email: string;
  status?: string;
  commissionPercent?: number | null;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--jy-accent-gold)]/10 via-white/5 to-purple-500/10 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--jy-accent-gold)]/20 text-sm font-bold text-[var(--jy-accent-gold)]">
          {name[0]?.toUpperCase() || "A"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--jy-text-primary)]">
            {name}
          </p>
          <p className="truncate text-[11px] text-[var(--jy-text-muted)]">
            {email}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        {status && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide",
              status === "APPROVED"
                ? "bg-emerald-500/15 text-emerald-400"
                : status === "REJECTED"
                  ? "bg-red-500/15 text-red-400"
                  : "bg-[var(--jy-accent-gold)]/15 text-[var(--jy-accent-gold)]",
            )}
          >
            {status}
          </span>
        )}
        {commissionPercent != null && (
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[var(--jy-text-secondary)]">
            Keep {commissionPercent}%
          </span>
        )}
      </div>
    </div>
  );
}

function SideNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 p-2">
      {NAV.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--jy-accent-gold)]/15 text-[var(--jy-accent-gold)]"
                : "text-[var(--jy-text-secondary)] hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
