"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck } from "lucide-react";
import {
  useAdminNotificationsRecent,
  useAdminUnreadCount,
  useAdminMarkNotificationRead,
  useAdminMarkAllNotificationsRead,
  type JyotishNotification,
} from "@/services/jyotish/notifications";
import { cn } from "@/lib/utils";

/**
 * Admin-side notification bell. Reads the Jyotish notification feed
 * (astrologer edit-requests, chat pings, etc.) — the pipeline that
 * fires when an astrologer posts in admin-chat or submits an edit
 * request. Pulls unread count every 15s + recent items every 10s.
 * Clicking an entry marks it read and follows the deep-link. "View
 * all" opens a dedicated page.
 */
export function AdminNotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: items = [] } = useAdminNotificationsRecent(10);
  const { data: unread = 0 } = useAdminUnreadCount();
  const markRead = useAdminMarkNotificationRead();
  const markAll = useAdminMarkAllNotificationsRead();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--accent-danger)] px-1 text-[10px] font-bold text-white ring-2 ring-[var(--bg-card,white)]">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[92vw] overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Notifications
                </p>
                {unread > 0 && (
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {unread} unread
                  </p>
                )}
              </div>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAll.mutate()}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent-primary)] hover:underline"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--text-muted)]">
                  You&apos;re all caught up.
                </div>
              ) : (
                <ul className="divide-y divide-[var(--border-primary)]">
                  {items.map((n: JyotishNotification) => (
                    <li
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3",
                        !n.read && "bg-[var(--accent-primary)]/5",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1 inline-block h-2 w-2 shrink-0 rounded-full",
                          n.read
                            ? "bg-transparent"
                            : "bg-[var(--accent-primary)]",
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
                            <NotifBody n={n} />
                          </Link>
                        ) : (
                          <NotifBody n={n} />
                        )}
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markRead.mutate(n.id)}
                          className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
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
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/admin/notifications");
              }}
              className="block w-full border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-center text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)]"
            >
              See all →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function NotifBody({ n }: { n: JyotishNotification }) {
  return (
    <>
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        {n.title}
      </p>
      {n.body && (
        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-secondary)]">
          {n.body}
        </p>
      )}
      <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        {new Date(n.createdAt).toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>
    </>
  );
}

export default AdminNotificationBell;
