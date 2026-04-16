"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/useUIStore";
import { ADMIN_NAV, type NavItem } from "@/config/navigation";
import { APP_NAME } from "@/config/constants";

/* -------------------------------------------------- */
/*  Single nav item (leaf)                            */
/* -------------------------------------------------- */
function NavLink({
  item,
  collapsed,
  depth = 0,
}: {
  item: NavItem;
  collapsed: boolean;
  depth?: number;
}) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
        depth > 0 && !collapsed && "ml-4 pl-4",
        active
          ? "bg-[var(--admin-sidebar-active)] text-white"
          : "text-[var(--text-secondary)] hover:bg-[var(--admin-sidebar-hover)] hover:text-[var(--text-primary)]",
        collapsed && "justify-center px-0",
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0",
            active ? "text-white" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]",
          )}
        />
      )}
      {!collapsed && <span className="truncate">{item.label}</span>}

      {/* Tooltip for collapsed mode */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] shadow-[var(--shadow-lg)] ring-1 ring-[var(--border-primary)] group-hover:block z-[60]">
          {item.label}
        </span>
      )}
    </Link>
  );
}

/* -------------------------------------------------- */
/*  Collapsible nav group (has children)              */
/* -------------------------------------------------- */
function NavGroup({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const childActive = item.children?.some((c) => pathname === c.href) ?? false;
  const [open, setOpen] = useState(childActive);
  const Icon = item.icon;

  // Keep in sync when route changes
  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  /* Collapsed mode: show icon only with tooltip listing children */
  if (collapsed) {
    return (
      <div className="group relative flex items-center justify-center rounded-lg px-0 py-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--admin-sidebar-hover)]">
        {Icon && (
          <Icon
            className={cn(
              "h-[18px] w-[18px] shrink-0",
              childActive
                ? "text-[var(--admin-sidebar-active)]"
                : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]",
            )}
          />
        )}
        {/* Flyout with child links */}
        <div className="pointer-events-none absolute left-full top-0 z-[60] ml-3 hidden min-w-[180px] rounded-lg bg-[var(--bg-primary)] p-1.5 shadow-[var(--shadow-lg)] ring-1 ring-[var(--border-primary)] group-hover:pointer-events-auto group-hover:block">
          <p className="mb-1 px-2.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {item.label}
          </p>
          {item.children?.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={cn(
                "block rounded-md px-2.5 py-1.5 text-sm transition-colors",
                pathname === child.href
                  ? "bg-[var(--admin-sidebar-active)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--admin-sidebar-hover)] hover:text-[var(--text-primary)]",
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
          childActive
            ? "text-[var(--text-primary)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--admin-sidebar-hover)] hover:text-[var(--text-primary)]",
        )}
      >
        {Icon && (
          <Icon
            className={cn(
              "h-[18px] w-[18px] shrink-0",
              childActive
                ? "text-[var(--admin-sidebar-active)]"
                : "text-[var(--text-muted)]",
            )}
          />
        )}
        <span className="flex-1 truncate text-left">{item.label}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        )}
      </button>

      {/* Animated children list */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-0.5 pb-1 pt-0.5">
            {item.children?.map((child) => (
              <NavLink key={child.href} item={child} collapsed={false} depth={1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/*  Main sidebar                                      */
/* -------------------------------------------------- */
export default function AdminSidebar() {
  const { sidebarCollapsed, sidebarOpen, setSidebarOpen, setSidebarCollapsed } =
    useUIStore();

  const closeMobile = useCallback(() => setSidebarOpen(false), [setSidebarOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--border-primary)] bg-[var(--admin-sidebar)] transition-all duration-300 ease-in-out",
          /* Desktop */
          "max-lg:translate-x-[-100%]",
          sidebarCollapsed ? "lg:w-[72px]" : "lg:w-64",
          /* Mobile */
          sidebarOpen ? "max-lg:translate-x-0 max-lg:w-72" : "max-lg:translate-x-[-100%]",
        )}
      >
        {/* Brand / logo */}
        <div className="flex h-[60px] shrink-0 items-center border-b border-[var(--border-primary)] px-4">
          {sidebarCollapsed ? (
            <span className="mx-auto text-lg font-bold text-[var(--accent-primary)]">
              A
            </span>
          ) : (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 text-[var(--text-primary)]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-sm font-bold text-white">
                A
              </span>
              <span className="text-base font-semibold tracking-tight">
                {APP_NAME}
              </span>
            </Link>
          )}

          {/* Mobile close button */}
          <button
            type="button"
            onClick={closeMobile}
            className="ml-auto rounded-md p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation (scrollable) */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-hide">
          {ADMIN_NAV.map((item) =>
            item.children && item.children.length > 0 ? (
              <NavGroup key={item.label} item={item} collapsed={sidebarCollapsed && !sidebarOpen} />
            ) : (
              <NavLink key={item.href} item={item} collapsed={sidebarCollapsed && !sidebarOpen} />
            ),
          )}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden shrink-0 border-t border-[var(--border-primary)] p-3 lg:block">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--admin-sidebar-hover)] hover:text-[var(--text-primary)]"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
