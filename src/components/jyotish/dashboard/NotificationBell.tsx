"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationAs,
} from "@/services/notifications";
import { cn } from "@/lib/utils";

interface Props {
  as?: NotificationAs;
}

/**
 * Header notification bell used on dashboards. Polls every 30s, shows an
 * unread pip on the icon and a dropdown with recent notifications. Reused
 * by both the astrologer dashboard and the admin shell — `as` controls
 * which stream to read.
 */
export function NotificationBell({ as = "ASTROLOGER" }: Props) {
  const [open, setOpen] = useState(false);
  const { data: items = [] } = useNotifications(as);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[var(--jy-text-secondary)] hover:bg-white/5"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-[340px] max-w-[90vw] overflow-hidden rounded-xl border border-white/10 bg-[var(--jy-bg-card,#12101d)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <p className="text-sm font-semibold text-[var(--jy-text-primary)]">
                Notifications
              </p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAll.mutate(as)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--jy-accent-gold,#f5d37f)] hover:underline"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-6 text-center text-sm text-[var(--jy-text-muted)]">
                  You&apos;re all caught up.
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {items.map((n) => (
                    <li
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3",
                        !n.read && "bg-white/5",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1 inline-block h-2 w-2 shrink-0 rounded-full",
                          n.read ? "bg-transparent" : "bg-[var(--jy-accent-gold,#f5d37f)]",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        {n.link ? (
                          <Link
                            href={n.link}
                            onClick={() => {
                              if (!n.read) markRead.mutate(n.id);
                              setOpen(false);
                            }}
                            className="block"
                          >
                            <p className="text-sm font-medium text-[var(--jy-text-primary)]">
                              {n.title}
                            </p>
                            {n.body && (
                              <p className="mt-0.5 text-xs text-[var(--jy-text-muted)]">
                                {n.body}
                              </p>
                            )}
                          </Link>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-[var(--jy-text-primary)]">
                              {n.title}
                            </p>
                            {n.body && (
                              <p className="mt-0.5 text-xs text-[var(--jy-text-muted)]">
                                {n.body}
                              </p>
                            )}
                          </>
                        )}
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--jy-text-muted)]">
                          {new Date(n.createdAt).toLocaleString([], {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markRead.mutate(n.id)}
                          className="rounded-md p-1 text-[var(--jy-text-muted)] hover:bg-white/10"
                          aria-label="Mark read"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
