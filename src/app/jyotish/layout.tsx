"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import { useWalletBalance } from "@/services/wallet";
import { usePrice } from "@/hooks/usePrice";
import { Wallet } from "lucide-react";

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
  const { isLoggedIn } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const openModal = useUIStore((s) => s.openModal);
  const { data: walletData } = useWalletBalance();
  const { format } = usePrice();

  const walletBalance =
    walletData && typeof walletData === "object" && "balance" in walletData
      ? Number((walletData as { balance: number | string }).balance) || 0
      : 0;

  const isDashboard = pathname.startsWith("/jyotish/astrologer-dashboard");

  if (isDashboard) {
    return <div className="jyotish-light min-h-screen">{children}</div>;
  }

  return (
    <div className="jyotish-dark min-h-screen bg-[var(--jy-bg-primary)] text-[var(--jy-text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[var(--jy-bg-primary)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/jyotish"
            className="flex items-center gap-2 text-xl font-bold"
          >
            <span className="text-2xl">&#9734;</span>
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
            {isLoggedIn ? (
              <>
                <Link
                  href="/jyotish/astrologer-dashboard/wallet"
                  className="hidden items-center gap-2 rounded-lg border border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/5 px-3 py-2 text-sm font-medium text-[var(--jy-accent-gold)] transition-colors hover:bg-[var(--jy-accent-gold)]/10 md:inline-flex"
                  title="Wallet"
                >
                  <Wallet className="h-4 w-4" />
                  <span>{format(walletBalance)}</span>
                </Link>
                <Link
                  href="/jyotish/astrologer-dashboard"
                  className="hidden rounded-lg bg-[var(--jy-accent-purple)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--jy-accent-purple-light)] md:inline-block"
                >
                  Dashboard
                </Link>
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
              {isLoggedIn ? (
                <>
                  <Link
                    href="/jyotish/astrologer-dashboard/wallet"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-lg bg-[var(--jy-accent-gold)]/10 px-3 py-2 text-sm font-medium text-[var(--jy-accent-gold)]"
                  >
                    <span className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Wallet</span>
                    <span>{format(walletBalance)}</span>
                  </Link>
                  <Link
                    href="/jyotish/astrologer-dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg bg-[var(--jy-accent-purple)] px-3 py-2 text-center text-sm font-medium text-white"
                  >
                    Dashboard
                  </Link>
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
                Services
              </h4>
              <ul className="space-y-2 text-sm text-[var(--jy-text-secondary)]">
                <li><Link href="/jyotish/consult-now" className="hover:text-[var(--jy-accent-gold)]">Vedic Astrology</Link></li>
                <li><Link href="/jyotish/consult-now" className="hover:text-[var(--jy-accent-gold)]">Numerology</Link></li>
                <li><Link href="/jyotish/consult-now" className="hover:text-[var(--jy-accent-gold)]">Tarot Reading</Link></li>
                <li><Link href="/jyotish/consult-now" className="hover:text-[var(--jy-accent-gold)]">Vastu Shastra</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--jy-text-muted)]">
                Company
              </h4>
              <ul className="space-y-2 text-sm text-[var(--jy-text-secondary)]">
                <li><Link href="/jyotish/about" className="hover:text-[var(--jy-accent-gold)]">About Us</Link></li>
                <li><Link href="/jyotish/contact" className="hover:text-[var(--jy-accent-gold)]">Contact</Link></li>
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
                href="/jyotish/astrologer-dashboard"
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
