"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3X3, Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";
import { ROUTES } from "@/config/routes";

type SiteVariant = "wizard" | "quickgo" | "jyotish";

function getSiteVariant(pathname: string): SiteVariant {
  if (pathname.startsWith("/hecate-quickgo")) return "quickgo";
  if (pathname.startsWith("/jyotish")) return "jyotish";
  return "wizard";
}

export function MobileNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const variant = getSiteVariant(pathname);
  const itemCount = useCartStore((s) => s.itemCount());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const { setSearchOpen } = useUIStore();

  const TABS =
    variant === "quickgo"
      ? ([
          { label: "Home", href: ROUTES.QUICKGO.HOME, icon: Home },
          { label: "Categories", href: ROUTES.QUICKGO.CATEGORIES, icon: Grid3X3 },
          { label: "Search", href: "__search__", icon: Search },
          { label: "Cart", href: "__cart__", icon: ShoppingBag },
          { label: "Account", href: ROUTES.QUICKGO.DASHBOARD, icon: User },
        ] as const)
      : ([
          { label: "Home", href: ROUTES.HOME, icon: Home },
          { label: "Categories", href: ROUTES.CATEGORIES, icon: Grid3X3 },
          { label: "Search", href: "__search__", icon: Search },
          { label: "Cart", href: "__cart__", icon: ShoppingBag },
          { label: "Account", href: ROUTES.DASHBOARD, icon: User },
        ] as const);

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[var(--border-primary)] bg-[var(--bg-primary)] px-1 py-1.5 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden",
        className,
      )}
    >
      {TABS.map((tab) => {
        const isAction = tab.href === "__search__" || tab.href === "__cart__";
        const isActive =
          !isAction &&
          (pathname === tab.href ||
            (tab.href !== "/" && pathname.startsWith(tab.href)));

        const content = (
          <div className="flex flex-col items-center gap-0.5">
            <div className="relative">
              <tab.icon
                className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  isActive
                    ? "text-[var(--accent-primary)]"
                    : "text-[var(--text-muted)]",
                )}
              />
              {tab.label === "Cart" && itemCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent-primary)] px-0.5 text-[9px] font-bold text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium transition-colors duration-200",
                isActive
                  ? "text-[var(--accent-primary)]"
                  : "text-[var(--text-muted)]",
              )}
            >
              {tab.label}
            </span>
          </div>
        );

        if (tab.href === "__search__") {
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex flex-1 items-center justify-center py-1"
              aria-label="Search"
            >
              {content}
            </button>
          );
        }

        if (tab.href === "__cart__") {
          return (
            <button
              key={tab.label}
              type="button"
              onClick={toggleCart}
              className="flex flex-1 items-center justify-center py-1"
              aria-label="Cart"
            >
              {content}
            </button>
          );
        }

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className="flex flex-1 items-center justify-center py-1"
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

export default MobileNav;
