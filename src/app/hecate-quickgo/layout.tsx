"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  Zap,
  Home,
  Grid3X3,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";
import Topbar from "@/components/layout/Topbar";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { ROUTES } from "@/config/routes";

const navLinks = [
  { href: "/hecate-quickgo/home", label: "Home", icon: Home },
  { href: "/hecate-quickgo/categories", label: "Categories", icon: Grid3X3 },
];

export default function HecateQuickGoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const { openModal } = useUIStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/hecate-quickgo/categories?search=${encodeURIComponent(searchQuery.trim())}`
      );
      setSearchQuery("");
    }
  };

  return (
    <div className="quickgo-theme min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Topbar - reusing main site topbar with quickgo variant */}
      <Topbar />

      {/* QuickGo Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-[var(--shadow-sm)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)] lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo */}
          <Link
            href="/hecate-quickgo/home"
            className="flex items-center gap-2 shrink-0"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-primary)] text-white font-bold text-sm">
              <Zap className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold text-[var(--accent-primary)] sm:text-xl">
              QuickGo
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-[var(--accent-primary-light)] text-[var(--accent-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Search bar (desktop) */}
          <form
            onSubmit={handleSearch}
            className="hidden lg:flex items-center flex-1 max-w-md mx-6"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle className="h-9 w-9" />

            {/* Cart */}
            <button
              type="button"
              onClick={toggleCart}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-primary)]"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent-primary)] px-1 text-[10px] font-bold text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>

            {/* User */}
            <button
              type="button"
              onClick={() => {
                if (isLoggedIn) {
                  router.push("/hecate-quickgo/dashboard");
                } else {
                  openModal("auth");
                }
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
              aria-label="Account"
            >
              {isLoggedIn && user ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-primary)] text-xs font-bold text-white">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </span>
              ) : (
                <User className="h-5 w-5" />
              )}
            </button>

            {/* Back to Mall */}
            <Link
              href={ROUTES.HOME}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-primary)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <Image
                src="/image/logohwm.png"
                alt="Mall"
                width={60}
                height={20}
                className="h-4 w-auto object-contain"
              />
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav className="border-t border-[var(--border-primary)] px-4 py-4 lg:hidden">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="mb-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none"
              />
            </form>

            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname.startsWith(link.href)
                      ? "bg-[var(--accent-primary-light)] text-[var(--accent-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
              {isLoggedIn && (
                <Link
                  href="/hecate-quickgo/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              )}
              <div className="border-t border-[var(--border-primary)] my-2" />
              <Link
                href={ROUTES.HOME}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              >
                <Image
                  src="/image/logohwm.png"
                  alt="Mall"
                  width={80}
                  height={28}
                  className="h-5 w-auto object-contain"
                />
                <span>Back to Mall</span>
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-primary)] bg-[var(--bg-primary)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <Link href="/hecate-quickgo/home" className="flex items-center gap-2 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-white">
                  <Zap className="h-4 w-4" />
                </span>
                <span className="text-lg font-bold text-[var(--accent-primary)]">
                  QuickGo
                </span>
              </Link>
              <p className="text-sm text-[var(--text-secondary)]">
                Fast delivery of groceries & essentials in 10 minutes.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                Quick Links
              </h4>
              <div className="flex flex-col gap-2">
                <Link href="/hecate-quickgo/home" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                  Home
                </Link>
                <Link href="/hecate-quickgo/categories" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                  Categories
                </Link>
                <Link href={ROUTES.ABOUT} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                  About Us
                </Link>
                <Link href={ROUTES.CONTACT} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                  Contact
                </Link>
              </div>
            </div>

            {/* Visit Mall */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                Also Visit
              </h4>
              <div className="flex flex-col gap-2">
                <Link href={ROUTES.HOME} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                  Hecate Wizard Mall
                </Link>
                <Link href={ROUTES.JYOTISH.HOME} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                  Jyotish
                </Link>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                Support
              </h4>
              <div className="flex flex-col gap-2">
                <Link href={ROUTES.CONTACT} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                  Help Center
                </Link>
                <Link href={ROUTES.SHIPPING_POLICY} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                  Shipping Policy
                </Link>
                <Link href={ROUTES.REFUND_POLICY} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                  Refund Policy
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[var(--border-primary)] pt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-[var(--text-muted)]">
              &copy; {new Date().getFullYear()} Hecate QuickGo. Fast delivery, always.
            </p>
            <div className="flex items-center gap-3">
              <Link href={ROUTES.PRIVACY} className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-primary)]">
                Privacy
              </Link>
              <Link href={ROUTES.TERMS} className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-primary)]">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
