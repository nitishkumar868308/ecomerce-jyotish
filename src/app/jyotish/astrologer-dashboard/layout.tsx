"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UserCircle2,
  Megaphone,
  MessageCircle,
  Gift,
  LogOut,
  Menu,
  X,
  Sparkles,
  Bell,
  Search,
  ChevronDown,
  Loader2,
  Clock,
  Wallet,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  useAstrologerProfile,
  useSetAstrologerOnline,
} from "@/services/jyotish/profile";
import { useAstrologerAdminChatUnread } from "@/services/jyotish/admin-chat";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/jyotish/dashboard/NotificationBell";
import { IncomingChatPopup } from "@/components/jyotish/dashboard/IncomingChatPopup";
import { TransitionOverlay } from "@/components/jyotish/chat/TransitionOverlay";
import { resolveAssetUrl } from "@/lib/assetUrl";

/**
 * Polished astrologer panel layout. Clean dark surface (no celestial
 * star overlay), purple→gold accent palette, glassmorphism cards.
 *
 *   Desktop (lg+): fixed 288px sidebar + main column with sticky
 *     header. Sidebar stays put when the content scrolls.
 *   Tablet/phone (<lg): sidebar collapses into an off-canvas drawer
 *     that slides in from the left, header becomes a compact bar with
 *     a hamburger. Everything stacks naturally.
 *
 * Nothing references CelestialBackground any more — the old starfield
 * was fighting against the panel look. The page-level gradient +
 * subtle ambient glow in the corners is enough visual interest.
 */

interface NavItem {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  /** Optional badge for unread counters etc. Resolved at render-time
   *  so we can pipe the live chat-unread count through one prop. */
  badgeKey?: "admin-chat";
}

const NAV: NavItem[] = [
  {
    href: "/jyotish/astrologer-dashboard",
    label: "Overview",
    Icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/jyotish/astrologer-dashboard/profile",
    label: "My Profile",
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
    badgeKey: "admin-chat",
  },
  {
    href: "/jyotish/astrologer-dashboard/requests",
    label: "Requests",
    Icon: Clock,
  },
  {
    href: "/jyotish/astrologer-dashboard/transactions",
    label: "Transactions",
    Icon: Wallet,
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
  const astroId = (astrologer?.id as number | undefined) ?? (user?.id as number | undefined);
  const { data: unreadChat = 0 } = useAstrologerAdminChatUnread(astroId);
  const setOnline = useSetAstrologerOnline();
  const isOnline = !!astrologer?.isOnline;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Auth guard — the rest of the panel assumes a logged-in astrologer.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("jyotish_token");
    if (!token) {
      router.replace("/login-jyotish");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  // Close mobile drawer whenever the route changes so tapping a link
  // doesn't leave the drawer stuck open over the new page.
  useEffect(() => {
    setMobileOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07050f] text-[var(--jy-text-muted)]">
        <div className="inline-flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--jy-accent-gold)]" />
          Checking your session…
        </div>
      </div>
    );
  }

  const fullName = user?.name ?? astrologer?.fullName ?? "Astrologer";
  const firstName = fullName.split(" ")[0];
  const avatarSrc = astrologer?.profile?.image
    ? resolveAssetUrl(astrologer.profile.image) || astrologer.profile.image
    : user?.avatar
      ? resolveAssetUrl(user.avatar) || user.avatar
      : "";
  const initials = fullName
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const status = astrologer?.isRejected
    ? "REJECTED"
    : astrologer?.isApproved
      ? "APPROVED"
      : "PENDING";

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("jyotish_token");
    }
    logout();
    router.push("/login-jyotish");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07050f] text-[var(--jy-text-primary)]">
      {/* Ambient corner glows — subtle, not a star field. Feels like a
          pro dashboard rather than a landing page. */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-[var(--jy-accent-purple)]/20 blur-[120px]" />
        <div className="absolute -right-32 top-40 h-80 w-80 rounded-full bg-[var(--jy-accent-gold)]/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[var(--jy-accent-purple)]/10 blur-[140px]" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* ── Desktop sidebar ── */}
        <Sidebar
          pathname={pathname}
          onNavigate={() => {}}
          user={{ name: fullName, email: user?.email ?? "" }}
          avatarSrc={avatarSrc}
          initials={initials}
          status={status}
          unreadChat={unreadChat}
          astroId={astroId}
          isApproved={!!astrologer?.isApproved}
          isOnline={isOnline}
          onToggleOnline={() =>
            astroId && setOnline.mutate({ id: astroId, online: !isOnline })
          }
          onlineBusy={setOnline.isPending}
          className="hidden w-72 shrink-0 lg:flex"
          onLogout={handleLogout}
        />

        {/* ── Main column ── */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          {/* ── Top bar ── */}
          <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0715]/80 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-[var(--jy-text-secondary)] hover:border-[var(--jy-accent-gold)]/40 hover:text-[var(--jy-accent-gold)] lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>

              {/* Mobile brand */}
              <Link
                href="/jyotish/astrologer-dashboard"
                className="inline-flex items-center gap-2 lg:hidden"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--jy-accent-purple)] to-[var(--jy-accent-gold)]">
                  <Sparkles className="h-4 w-4 text-white" />
                </span>
                <span className="text-sm font-bold tracking-widest text-[var(--jy-accent-gold)]">
                  JYOTISH
                </span>
              </Link>

              {/* Search (desktop only, placeholder for now) */}
              <div className="relative ml-1 hidden max-w-sm flex-1 lg:block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--jy-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search sessions, messages…"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-faint)] outline-none focus:border-[var(--jy-accent-gold)]/50 focus:bg-white/[0.05]"
                />
              </div>

              <div className="ml-auto flex items-center gap-2">
                <NotificationBell />

                {/* Profile menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-1 py-1 pr-3 text-sm hover:border-[var(--jy-accent-gold)]/30 hover:bg-white/[0.05]"
                  >
                    <Avatar src={avatarSrc} initials={initials} size="sm" />
                    <span className="hidden text-[var(--jy-text-secondary)] sm:inline">
                      {firstName}
                    </span>
                    <ChevronDown className="hidden h-3.5 w-3.5 text-[var(--jy-text-muted)] sm:inline" />
                  </button>
                  {profileMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0f0a24] shadow-2xl">
                        <div className="border-b border-white/10 px-4 py-3">
                          <p className="truncate text-sm font-semibold text-[var(--jy-text-primary)]">
                            {fullName}
                          </p>
                          <p className="truncate text-[11px] text-[var(--jy-text-muted)]">
                            {user?.email}
                          </p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/jyotish/astrologer-dashboard/profile"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--jy-text-secondary)] hover:bg-white/5 hover:text-white"
                          >
                            <UserCircle2 className="h-4 w-4" />
                            My profile
                          </Link>
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* ── Page content ── */}
          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>

      {/* Floating incoming-request popup. Mounted at the layout level
          so it's visible on every dashboard page, not just overview. */}
      <IncomingChatPopup />

      {/* Full-page mystical loader for accept/end transitions — driven
          by useUIStore.transitionMessage. */}
      <TransitionOverlay />

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <Sidebar
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
            user={{ name: fullName, email: user?.email ?? "" }}
            avatarSrc={avatarSrc}
            initials={initials}
            status={status}
            unreadChat={unreadChat}
            className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs animate-in slide-in-from-left-6 duration-200"
            onLogout={handleLogout}
            onClose={() => setMobileOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Sidebar ─────────────────────────── */

function Sidebar({
  pathname,
  onNavigate,
  user,
  avatarSrc,
  initials,
  status,
  unreadChat,
  astroId,
  isApproved,
  isOnline,
  onToggleOnline,
  onlineBusy,
  className,
  onLogout,
  onClose,
}: {
  pathname: string;
  onNavigate: () => void;
  user: { name: string; email: string };
  avatarSrc: string;
  initials: string;
  status: string;
  unreadChat: number;
  astroId?: number;
  isApproved: boolean;
  isOnline: boolean;
  onToggleOnline: () => void;
  onlineBusy: boolean;
  className?: string;
  onLogout: () => void;
  onClose?: () => void;
}) {
  return (
    <aside
      className={cn(
        "flex-col border-r border-white/5 bg-[#0a0715]/90 backdrop-blur-xl",
        className,
      )}
    >
      {/* Brand */}
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-5">
        <Link
          href="/jyotish/astrologer-dashboard"
          onClick={onNavigate}
          className="inline-flex items-center gap-2.5"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--jy-accent-purple)] to-[var(--jy-accent-gold)] shadow-lg shadow-[var(--jy-accent-gold)]/20">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-[0.2em] text-[var(--jy-accent-gold)]">
              JYOTISH
            </span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--jy-text-muted)]">
              Astrologer panel
            </span>
          </span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--jy-text-muted)] hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Profile card */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--jy-accent-purple)]/15 via-white/[0.02] to-[var(--jy-accent-gold)]/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar src={avatarSrc} initials={initials} size="md" ring />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--jy-text-primary)]">
                {user.name}
              </p>
              <p className="truncate text-[11px] text-[var(--jy-text-muted)]">
                {user.email}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px]">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold uppercase tracking-wider",
                status === "APPROVED"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : status === "REJECTED"
                    ? "bg-red-500/15 text-red-300"
                    : "bg-[var(--jy-accent-gold)]/15 text-[var(--jy-accent-gold)]",
              )}
            >
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  status === "APPROVED"
                    ? "bg-emerald-400"
                    : status === "REJECTED"
                      ? "bg-red-400"
                      : "bg-[var(--jy-accent-gold)]",
                )}
              />
              {status}
            </span>
          </div>

          {/* Online/offline self-toggle. Sits inside the profile card
              so it reads as "my availability" rather than a system
              control — clearer than a pill in the global header. Only
              shown once admin has approved the account. */}
          {astroId && isApproved && (
            <button
              type="button"
              disabled={onlineBusy}
              onClick={onToggleOnline}
              className={cn(
                "mt-3 flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60",
                isOnline
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                  : "border-white/10 bg-white/5 text-[var(--jy-text-secondary)] hover:bg-white/10",
              )}
              title={
                isOnline
                  ? "You're online — User can book you"
                  : "You're offline — tap to go online"
              }
            >
              <span className="inline-flex items-center gap-2">
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    isOnline
                      ? "bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.25)]"
                      : "bg-[var(--jy-text-muted)]",
                  )}
                />
                {isOnline ? "Online" : "Offline"}
              </span>
              <span
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                  isOnline ? "bg-emerald-500/50" : "bg-white/10",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                    isOnline ? "translate-x-[18px]" : "translate-x-0.5",
                  )}
                />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-5 flex-1 overflow-y-auto px-3 pb-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--jy-text-faint)]">
          Menu
        </p>
        <ul className="space-y-1">
          {NAV.map(({ href, label, Icon, exact, badgeKey }) => {
            const active = exact
              ? pathname === href
              : pathname.startsWith(href) && href !== "/jyotish/astrologer-dashboard";
            const badge =
              badgeKey === "admin-chat" && unreadChat > 0 ? unreadChat : 0;
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-gradient-to-r from-[var(--jy-accent-gold)]/15 to-transparent text-[var(--jy-accent-gold)] shadow-[inset_0_0_0_1px_rgba(255,215,0,0.15)]"
                      : "text-[var(--jy-text-secondary)] hover:bg-white/[0.04] hover:text-white",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                      active
                        ? "bg-[var(--jy-accent-gold)]/20 text-[var(--jy-accent-gold)]"
                        : "bg-white/5 text-[var(--jy-text-muted)] group-hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 truncate">{label}</span>
                  {badge > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--jy-accent-gold)] px-1 text-[10px] font-bold text-[var(--jy-bg-primary)]">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: sign out */}
      <div className="border-t border-white/5 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--jy-text-secondary)] transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
            <LogOut className="h-4 w-4" />
          </span>
          Sign out
        </button>
      </div>
    </aside>
  );
}

/* ─────────────────────────── Avatar ─────────────────────────── */

function Avatar({
  src,
  initials,
  size,
  ring,
}: {
  src: string;
  initials: string;
  size: "sm" | "md";
  ring?: boolean;
}) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-11 w-11 text-sm";
  const className = cn(
    "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--jy-accent-gold)]/25 to-[var(--jy-accent-purple)]/25 font-bold text-[var(--jy-accent-gold)] overflow-hidden",
    dim,
    ring && "ring-2 ring-[var(--jy-accent-gold)]/40",
  );
  if (src) {
    /* eslint-disable-next-line @next/next/no-img-element */
    return <img src={src} alt="" className={className} />;
  }
  return <span className={className}>{initials}</span>;
}
