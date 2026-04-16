"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, LogOut, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/useUIStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getInitials } from "@/lib/utils";
import { ROUTES } from "@/config/routes";

/* -------------------------------------------------- */
/*  Breadcrumb from pathname                          */
/* -------------------------------------------------- */
function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname
    .replace(/^\/admin\/?/, "")
    .split("/")
    .filter(Boolean);

  if (segments.length === 0) return <span className="text-sm font-medium text-[var(--text-primary)]">Dashboard</span>;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      <Link
        href={ROUTES.ADMIN.DASHBOARD}
        className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
      >
        Admin
      </Link>
      {segments.map((seg, i) => {
        const href = "/admin/" + segments.slice(0, i + 1).join("/");
        const label = seg
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        const isLast = i === segments.length - 1;

        return (
          <span key={href} className="flex items-center gap-1">
            <span className="text-[var(--text-faint)]">/</span>
            {isLast ? (
              <span className="font-medium text-[var(--text-primary)]">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

/* -------------------------------------------------- */
/*  User dropdown                                     */
/* -------------------------------------------------- */
function UserDropdown() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayName = user?.name ?? "Admin";
  const initials = getInitials(displayName);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--bg-tertiary)]"
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={displayName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-primary)] text-xs font-semibold text-white">
            {initials}
          </span>
        )}
        <span className="hidden max-w-[120px] truncate text-sm font-medium text-[var(--text-primary)] md:block">
          {displayName}
        </span>
        <ChevronDown
          className={cn(
            "hidden h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 md:block",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 animate-scaleIn origin-top-right rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] p-1 shadow-[var(--shadow-lg)]">
          {/* User info */}
          <div className="border-b border-[var(--border-primary)] px-3 py-2.5">
            <p className="text-sm font-medium text-[var(--text-primary)]">{displayName}</p>
            <p className="truncate text-xs text-[var(--text-muted)]">{user?.email ?? ""}</p>
          </div>

          <div className="py-1">
            <Link
              href={ROUTES.ADMIN.DASHBOARD}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[var(--accent-danger)] transition-colors hover:bg-[var(--accent-danger-light)]"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------- */
/*  Header                                            */
/* -------------------------------------------------- */
export default function AdminHeader() {
  const { sidebarCollapsed, setSidebarOpen } = useUIStore();

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-30 flex h-[60px] items-center border-b border-[var(--border-primary)] bg-[var(--admin-header)] px-4 shadow-sm transition-all duration-300 ease-in-out md:px-6",
        sidebarCollapsed ? "lg:left-[72px]" : "lg:left-64",
        "left-0",
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Breadcrumb />
      </div>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-1 md:gap-2">
        <ThemeToggle />

        {/* Notification bell */}
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {/* Unread dot */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--accent-danger)]" />
        </button>

        {/* Separator */}
        <div className="mx-1 hidden h-6 w-px bg-[var(--border-primary)] md:block" />

        <UserDropdown />
      </div>
    </header>
  );
}
