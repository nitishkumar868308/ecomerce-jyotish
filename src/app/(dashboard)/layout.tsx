"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Sparkles,
  User as UserIcon,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DefaultPage } from "@/components/layout/DefaultPage";
import { PrivateRoute } from "@/components/shared/PrivateRoute";

// Shared shell for every /dashboard/* page. A persistent sidebar on lg+
// and a horizontally-scrolling pill row on mobile give the shopper a
// one-click path between Orders, Addresses, Wallet, Profile, etc. without
// having to bounce back to /dashboard first.

// Wallet is surfaced inside the Jyotish section (consultations + wallet live
// together since the wallet is spent on consultations). Keeping it off the
// top-level nav avoids redundancy and keeps the shopper's mental model clean.
const NAV = [
  { href: "/dashboard", label: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/dashboard/orders", label: "My Orders", Icon: Package },
  { href: "/dashboard/addresses", label: "Addresses", Icon: MapPin },
  { href: "/dashboard/jyotish", label: "Jyotish", Icon: Sparkles },
  { href: "/dashboard/profile", label: "Profile", Icon: UserIcon },
];

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <DefaultPage>
      <PrivateRoute>
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8 lg:px-8">
          {/* Mobile / tablet tab strip */}
          <nav
            aria-label="Dashboard sections"
            className="-mx-4 overflow-x-auto px-4 pb-1 lg:hidden"
          >
            <ul className="flex min-w-max gap-2">
              {NAV.map(({ href, label, Icon, exact }) => {
                const active = isActive(href, exact);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
                        active
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                          : "border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Desktop sidebar */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <nav
              aria-label="Dashboard sections"
              className="sticky top-24 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-2"
            >
              <ul className="flex flex-col gap-0.5">
                {NAV.map(({ href, label, Icon, exact }) => {
                  const active = isActive(href, exact);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </PrivateRoute>
    </DefaultPage>
  );
}
