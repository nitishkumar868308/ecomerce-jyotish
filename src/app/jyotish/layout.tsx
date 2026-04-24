"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import { useWalletBalance } from "@/services/wallet";
import { usePrice } from "@/hooks/usePrice";
import { Wallet, LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { Topbar } from "@/components/layout/Topbar";
import { ConnectingModal } from "@/components/jyotish/consult-now/ConnectingModal";
import { ActiveSessionBanner } from "@/components/jyotish/chat/ActiveSessionBanner";
import { TransitionOverlay } from "@/components/jyotish/chat/TransitionOverlay";

const navLinks = [
  { href: "/jyotish", label: "Home" },
  { href: "/jyotish/consult-now", label: "Consult Now" },
  { href: "/jyotish/about", label: "About" },
  { href: "/jyotish/contact", label: "Contact" },
];

export default function JyotishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const openModal = useUIStore((s) => s.openModal);
  const { data: walletData } = useWalletBalance();
  const { format } = usePrice();

  // Public jyotish pages are a SHOPPER surface — they never show an
  // astrologer's own account chrome even when the astrologer is
  // logged in via /login-jyotish. Astrologer sessions have
  // `user.role === "ASTROLOGER"`; only shopper sessions should light
  // up the wallet + profile dropdown here. This keeps the astrologer
  // from being nudged into a "book a consultation" flow against
  // themselves and mirrors how the admin nav stays separate.
  const isShopperSession =
    isLoggedIn &&
    !!user &&
    String((user as { role?: string }).role ?? "USER").toUpperCase() !==
      "ASTROLOGER";

  const walletBalance =
    walletData && typeof walletData === "object" && "balance" in walletData
      ? Number((walletData as { balance: number | string }).balance) || 0
      : 0;

  const isDashboard = pathname.startsWith("/jyotish/astrologer-dashboard");

  if (isDashboard) {
    // Astrologer dashboard intentionally opts into the dark celestial
    // theme (gold + purple on deep midnight) so the panel visually
    // matches the rest of the Jyotish surface instead of reverting to
    // the pastel admin look. Individual pages still render their own
    // chrome via astrologer-dashboard/layout.tsx.
    return (
      <div className="jyotish-dark min-h-screen">
        {children}
        <ConnectingModal />
        <TransitionOverlay />
      </div>
    );
  }

  return (
    <div className="jyotish-dark min-h-screen bg-[var(--jy-bg-primary)] text-[var(--jy-text-primary)]">
      {/* Country / currency topbar so international visitors see
          Jyotish prices converted to their selected currency AND
          wallet recharge / session payments route through PayGlocal
          (non-IND) vs PayU (IND) based on this selection. Same
          component the wizard + quickgo surfaces use — variant
          detection reads the pathname so `jyotish` styling kicks in
          automatically. */}
      <Topbar />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[var(--jy-bg-primary)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/jyotish"
            className="flex items-center gap-2.5 text-xl font-bold"
          >
            {/* Shared brand mark sourced from /public/image/logohwm.png so
                the jyotish surface visually ties back to Hecate Wizard
                Mall. Explicit width/height keeps next/image happy without
                CLS while we scale with responsive tailwind classes. */}
            <Image
              src="/image/logohwm.png"
              alt="Hecate Wizard Mall"
              width={140}
              height={40}
              priority
              className="h-8 w-auto object-contain sm:h-10"
            />
            <span
              className="bg-gradient-to-r from-[var(--jy-accent-gold)] to-[var(--jy-accent-purple-light)] bg-clip-text text-transparent"
            >
              Jyotish
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-[var(--jy-accent-gold)]",
                  pathname === link.href
                    ? "text-[var(--jy-accent-gold)]"
                    : "text-[var(--jy-text-secondary)]",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isShopperSession && user ? (
              <>
                <Link
                  href={ROUTES.DASHBOARD_WALLET ?? "/dashboard/wallet"}
                  className="hidden items-center gap-2 rounded-lg border border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/5 px-3 py-2 text-sm font-medium text-[var(--jy-accent-gold)] transition-colors hover:bg-[var(--jy-accent-gold)]/10 md:inline-flex"
                  title="Wallet"
                >
                  <Wallet className="h-4 w-4" />
                  <span>{format(walletBalance)}</span>
                </Link>

                {/* Avatar + hover dropdown — mirrors the wizard / quickgo
                    header. Dashboard link goes to the shopper dashboard
                    (/dashboard), not the astrologer one. */}
                <div className="relative group hidden md:block">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-[var(--jy-text-secondary)] transition-colors hover:bg-white/5 hover:text-white"
                    aria-label="Account"
                  >
                    {user.avatar || user.profileImage ? (
                      <Image
                        // Profile images are stored as /uploads/... relative
                        // paths. Next/Image needs an absolute URL that's
                        // been whitelisted — pass through the asset resolver
                        // (same pattern as the wizard header) or fall back
                        // to the raw value if the resolver returns empty.
                        src={
                          resolveAssetUrl(
                            user.avatar || user.profileImage || "",
                          ) ||
                          user.avatar ||
                          user.profileImage ||
                          ""
                        }
                        alt={user.name}
                        width={32}
                        height={32}
                        unoptimized
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--jy-accent-gold)] to-amber-500 text-xs font-bold text-[var(--jy-bg-primary)]">
                        {user.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) ?? "U"}
                      </span>
                    )}
                    <span className="hidden max-w-[100px] truncate text-xs font-medium text-[var(--jy-text-primary)] sm:block">
                      Welcome, {user.name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="hidden h-3.5 w-3.5 text-[var(--jy-text-muted)] sm:block" />
                  </button>

                  <div className="invisible absolute right-0 top-full z-50 w-52 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--jy-bg-primary)] shadow-xl">
                      <div className="border-b border-white/10 px-4 py-3">
                        <p className="truncate text-sm font-medium text-[var(--jy-text-primary)]">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-[var(--jy-text-muted)]">
                          {user.email}
                        </p>
                      </div>
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => router.push(ROUTES.DASHBOARD)}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--jy-text-secondary)] transition-colors hover:bg-white/5 hover:text-white"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            router.push("/jyotish");
                          }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => openModal("auth")}
                className="hidden rounded-lg border border-[var(--jy-accent-gold)]/30 px-4 py-2 text-sm font-medium text-[var(--jy-accent-gold)] transition-colors hover:bg-[var(--jy-accent-gold)]/10 md:inline-block"
              >
                Login
              </button>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-[var(--jy-text-secondary)] transition-colors hover:bg-white/5 md:hidden"
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="border-t border-white/5 bg-[var(--jy-bg-primary)] px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-white/5 text-[var(--jy-accent-gold)]"
                      : "text-[var(--jy-text-secondary)] hover:bg-white/5",
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {isShopperSession && user ? (
                <>
                  <Link
                    href={ROUTES.DASHBOARD_WALLET ?? "/dashboard/wallet"}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-lg bg-[var(--jy-accent-gold)]/10 px-3 py-2 text-sm font-medium text-[var(--jy-accent-gold)]"
                  >
                    <span className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" /> Wallet
                    </span>
                    <span>{format(walletBalance)}</span>
                  </Link>
                  <Link
                    href={ROUTES.DASHBOARD}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-[var(--jy-text-primary)]"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                      router.push("/jyotish");
                    }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    openModal("auth");
                  }}
                  className="rounded-lg bg-[var(--jy-accent-purple)] px-3 py-2 text-center text-sm font-medium text-white w-full"
                >
                  Login
                </button>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>

      {/* Global "Connecting to astrologer…" modal — mounted once so any
          page inside /jyotish (card grids + detail page) can trigger it
          via useUIStore without wiring state through every component. */}
      <ConnectingModal />

      {/* Floating "Return to chat" banner — polls for the shopper's
          active session and nudges them back in if they've wandered
          off while a paid consultation is ticking. Auto-hides on the
          actual chat page to avoid stacking chrome. */}
      <ActiveSessionBanner />

      {/* Full-page transition loader — driven by useUIStore, shown
          while accept/end mutations + navigations are in flight so
          the UI never feels frozen. */}
      <TransitionOverlay />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[var(--jy-bg-primary)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <span>&#9734;</span> Jyotish
              </h3>
              <p className="text-sm text-[var(--jy-text-muted)]">
                Connect with experienced astrologers for personalized guidance
                on life, career, relationships, and more.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--jy-text-muted)]">
                Company
              </h4>
              <ul className="space-y-2 text-sm text-[var(--jy-text-secondary)]">
                <li><Link href="/jyotish/about" className="hover:text-[var(--jy-accent-gold)]">About Us</Link></li>
                <li><Link href="/jyotish/contact" className="hover:text-[var(--jy-accent-gold)]">Contact</Link></li>
                <li><Link href="/jyotish/consult-now" className="hover:text-[var(--jy-accent-gold)]">Consult Now</Link></li>
                <li><Link href="/register-jyotish" className="hover:text-[var(--jy-accent-gold)]">Join as Astrologer</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--jy-text-muted)]">
                Contact Us
              </h4>
              <ul className="space-y-3 text-sm text-[var(--jy-text-secondary)]">
                <li className="leading-relaxed">
                  27 Deepali, Pitampura,<br />New Delhi 110034
                </li>
                <li>
                  <a
                    href="mailto:info@hecatewizardmall.com"
                    className="hover:text-[var(--jy-accent-gold)]"
                  >
                    info@hecatewizardmall.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+919717033830"
                    className="hover:text-[var(--jy-accent-gold)]"
                  >
                    +91 9717033830
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--jy-text-muted)]">
                Join Us
              </h4>
              <p className="mb-3 text-sm text-[var(--jy-text-secondary)]">
                Are you an astrologer? Join our platform.
              </p>
              <Link
                href="/register-jyotish"
                className="inline-block rounded-lg bg-[var(--jy-accent-gold)]/10 px-4 py-2 text-sm font-medium text-[var(--jy-accent-gold)] transition-colors hover:bg-[var(--jy-accent-gold)]/20"
              >
                Register as Astrologer
              </Link>
            </div>
          </div>
          <div className="mt-8 border-t border-white/5 pt-6 text-center text-xs text-[var(--jy-text-faint)]">
            &copy; {new Date().getFullYear()} Jyotish. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
