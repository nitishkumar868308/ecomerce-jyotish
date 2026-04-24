"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Check,
  Loader2,
  Circle,
  BadgeCheck,
  XCircle,
  AlertTriangle,
  MessageCircle,
  Power,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  useAstrologerNotificationsAll,
  useAstrologerMarkNotificationRead,
  useAstrologerMarkAllNotificationsRead,
  type JyotishNotification,
} from "@/services/jyotish/notifications";
import { cn } from "@/lib/utils";

type Filter = "ALL" | "UNREAD";

/**
 * Full astrologer notification feed. Grouped loosely by kind via the
 * icon; individual rows show title / body / timestamp. Clicking a row
 * marks it read and follows the link when present. A "Mark all read"
 * shortcut sits in the header alongside the tab toggle.
 */
export default function AstrologerNotificationsPage() {
  const { user } = useAuthStore();
  const astrologerId = user?.id as number | undefined;
  const { data: items = [], isLoading } =
    useAstrologerNotificationsAll(astrologerId);
  const markRead = useAstrologerMarkNotificationRead();
  const markAll = useAstrologerMarkAllNotificationsRead();
  const [filter, setFilter] = useState<Filter>("ALL");

  const { filtered, unreadCount } = useMemo(() => {
    const unreadCount = items.filter((n) => !n.read).length;
    const filtered =
      filter === "UNREAD" ? items.filter((n) => !n.read) : items;
    return { filtered, unreadCount };
  }, [items, filter]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--jy-accent-purple)] to-[var(--jy-accent-gold)] text-white shadow-lg">
            <Bell className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-[var(--jy-text-primary)] sm:text-2xl">
              Notifications
            </h1>
            <p className="text-sm text-[var(--jy-text-muted)]">
              Updates from admin — approvals, penalties, chat pings.
            </p>
          </div>
        </div>
        {unreadCount > 0 && astrologerId && (
          <button
            type="button"
            onClick={() => markAll.mutate(astrologerId)}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/10 px-3 py-2 text-xs font-semibold text-[var(--jy-accent-gold)] hover:bg-[var(--jy-accent-gold)]/15"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read ({unreadCount})
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "UNREAD"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
              filter === k
                ? "border-[var(--jy-accent-gold)] bg-[var(--jy-accent-gold)]/10 text-[var(--jy-accent-gold)]"
                : "border-white/10 text-[var(--jy-text-secondary)] hover:border-[var(--jy-accent-gold)]/40",
            )}
          >
            {k === "ALL" ? "All" : "Unread"}
            <span
              className={cn(
                "inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                filter === k
                  ? "bg-[var(--jy-accent-gold)] text-[var(--jy-bg-primary)]"
                  : "bg-white/5 text-[var(--jy-text-muted)]",
              )}
            >
              {k === "ALL" ? items.length : unreadCount}
            </span>
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--jy-bg-card)]">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-[var(--jy-text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading notifications…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/10 text-[var(--jy-accent-gold)]">
              <Bell className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-[var(--jy-text-primary)]">
              {filter === "UNREAD" ? "Nothing unread" : "No notifications yet"}
            </p>
            <p className="mt-1 text-xs text-[var(--jy-text-muted)]">
              {filter === "UNREAD"
                ? "You're all caught up."
                : "You'll see approvals, penalties and admin replies here."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {filtered.map((n) => (
              <NotificationRow
                key={n.id}
                notif={n}
                onRead={() => {
                  if (!n.read && astrologerId) {
                    markRead.mutate({ astrologerId, id: n.id });
                  }
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ───────── row ───────── */

function NotificationRow({
  notif,
  onRead,
}: {
  notif: JyotishNotification;
  onRead: () => void;
}) {
  const { Icon, accent, bg } = kindVisual(notif.kind);
  return (
    <li
      className={cn(
        "flex items-start gap-3 px-4 py-4 sm:px-5",
        !notif.read && "bg-[var(--jy-accent-gold)]/[0.04]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          bg,
          accent,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        {notif.link ? (
          <Link
            href={notif.link}
            onClick={onRead}
            className="block"
          >
            <RowBody notif={notif} />
          </Link>
        ) : (
          <RowBody notif={notif} />
        )}
      </div>
      {!notif.read && (
        <button
          type="button"
          onClick={onRead}
          className="rounded-md p-1 text-[var(--jy-text-muted)] hover:bg-white/10"
          aria-label="Mark read"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}

function RowBody({ notif }: { notif: JyotishNotification }) {
  return (
    <>
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm font-semibold text-[var(--jy-text-primary)]">
          {notif.title}
        </p>
        {!notif.read && (
          <Circle className="mt-1.5 h-2 w-2 shrink-0 fill-[var(--jy-accent-gold)] text-[var(--jy-accent-gold)]" />
        )}
      </div>
      {notif.body && (
        <p className="mt-1 whitespace-pre-wrap break-words text-xs text-[var(--jy-text-secondary)]">
          {notif.body}
        </p>
      )}
      <p className="mt-2 text-[10px] uppercase tracking-widest text-[var(--jy-text-muted)]">
        {new Date(notif.createdAt).toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>
    </>
  );
}

function kindVisual(kind: string) {
  switch (kind) {
    case "APPROVED":
    case "EDIT_REQUEST_APPROVED":
    case "ACTIVATED":
      return {
        Icon: BadgeCheck,
        accent: "text-emerald-300",
        bg: "bg-emerald-500/15",
      };
    case "REJECTED":
    case "EDIT_REQUEST_REJECTED":
      return { Icon: XCircle, accent: "text-red-300", bg: "bg-red-500/15" };
    case "PENALTY_ADDED":
      return {
        Icon: AlertTriangle,
        accent: "text-red-300",
        bg: "bg-red-500/15",
      };
    case "DEACTIVATED":
      return {
        Icon: Power,
        accent: "text-amber-300",
        bg: "bg-amber-500/15",
      };
    case "ADMIN_CHAT_MESSAGE":
      return {
        Icon: MessageCircle,
        accent: "text-[var(--jy-accent-purple-light)]",
        bg: "bg-[var(--jy-accent-purple)]/20",
      };
    default:
      return {
        Icon: Bell,
        accent: "text-[var(--jy-accent-gold)]",
        bg: "bg-[var(--jy-accent-gold)]/15",
      };
  }
}
