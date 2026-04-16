"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  User,
  LogOut,
  Package,
  ChevronDown,
  UserPlus,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";
import { STORE_NAV } from "@/config/navigation";
import { APP_NAME } from "@/config/constants";
import { ROUTES } from "@/config/routes";
import SearchInput from "@/components/ui/SearchInput";

export function Header({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user, isLoggedIn, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const { mobileMenuOpen, setMobileMenuOpen, searchOpen, setSearchOpen } = useUIStore();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname, setMobileMenuOpen, setSearchOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-[var(--shadow-sm)] transition-shadow duration-300",
        className,
      )}
    >
      <div className="flex h-[60px] items-center justify-between px-4 lg:px-8">
        {/* Mobile: Hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)] md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Logo */}
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-[var(--text-primary)] transition-colors hover:text-[var(--accent-primary)] md:text-xl"
        >
          <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop: Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {STORE_NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-[var(--accent-primary-light)] text-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Search toggle (desktop) */}
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="hidden h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] md:inline-flex"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Cart */}
          <button
            type="button"
            onClick={toggleCart}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent-primary)] px-1 text-[10px] font-bold text-white">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>

          {/* User dropdown (desktop) */}
          <div ref={userDropdownRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Account"
            >
              {isLoggedIn && user ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-primary)] text-xs font-bold text-white">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </span>
              ) : (
                <User className="h-5 w-5" />
              )}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  userDropdownOpen && "rotate-180",
                )}
              />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] py-1.5 shadow-[var(--shadow-lg)] animate-in fade-in slide-in-from-top-2 duration-150">
                {isLoggedIn && user ? (
                  <>
                    <div className="border-b border-[var(--border-primary)] px-4 py-3">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href={ROUTES.DASHBOARD_PROFILE}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                      >
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                      <Link
                        href={ROUTES.DASHBOARD_ORDERS}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                      >
                        <Package className="h-4 w-4" />
                        My Orders
                      </Link>
                    </div>
                    <div className="border-t border-[var(--border-primary)] pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[var(--accent-danger)] transition-colors hover:bg-[var(--accent-danger-light)]"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-1">
                    <Link
                      href={ROUTES.HOME}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <LogIn className="h-4 w-4" />
                      Login
                    </Link>
                    <Link
                      href={ROUTES.HOME}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <UserPlus className="h-4 w-4" />
                      Register
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search bar (expandable) */}
      <div
        className={cn(
          "overflow-hidden border-t border-[var(--border-primary)] transition-all duration-300",
          searchOpen ? "max-h-20 py-3 px-4 lg:px-8" : "max-h-0 py-0 px-4",
        )}
      >
        <SearchInput
          onSearch={(q) => {
            if (q) {
              /* navigate to search results - handled by parent */
            }
          }}
          placeholder="Search products, categories..."
          fullWidth
          className="max-w-2xl mx-auto"
        />
      </div>

      {/* Mobile slide-down menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-[var(--border-primary)] transition-all duration-300 md:hidden",
          mobileMenuOpen ? "max-h-[400px]" : "max-h-0",
        )}
      >
        <nav className="flex flex-col px-4 py-2">
          {STORE_NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-[var(--accent-primary-light)] text-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Mobile: Auth links */}
          <div className="mt-2 border-t border-[var(--border-primary)] pt-2">
            {isLoggedIn && user ? (
              <>
                <Link
                  href={ROUTES.DASHBOARD_PROFILE}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--accent-danger)] transition-colors hover:bg-[var(--accent-danger-light)]"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href={ROUTES.HOME}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
                <Link
                  href={ROUTES.HOME}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  <UserPlus className="h-4 w-4" />
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
