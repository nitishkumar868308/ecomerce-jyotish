"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck } from "lucide-react";
import {
  useAstrologerNotificationsRecent,
  useAstrologerUnreadCount,
  useAstrologerMarkNotificationRead,
  useAstrologerMarkAllNotificationsRead,
} from "@/services/jyotish/notifications";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

/**
 * Astrologer-panel notification bell. Pulls from the new Jyotish
 * notification feed (edit-request approvals, penalties, active toggle,
 * admin chat pings). Polls via react-query — unread count refreshes
 * every 15s, recent list every 10s. "View all" routes to the full
 * notifications page.
 */
export function NotificationBell() {
  const router = useRouter();
  const { user } = useAuthStore();
  const astrologerId = user?.id as number | undefined;
  const [open, setOpen] = useState(false);
  const { data: items = [] } = useAstrologerNotificationsRecent(
    astrologerId,
    10,
  );
  const { data: unread = 0 } = useAstrologerUnreadCount(astrologerId);
  const markRead = useAstrologerMarkNotificationRead();
  const markAll = useAstrologerMarkAllNotificationsRead();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-[var(--jy-text-secondary)] hover:border-[var(--jy-accent-gold)]/40 hover:text-[var(--jy-accent-gold)]"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--jy-accent-gold)] px-1 text-[10px] font-bold text-[var(--jy-bg-primary)] ring-2 ring-[#0a0715]">
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
          <div className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[92vw] overflow-hidden rounded-2xl border border-white/10 bg-[#0f0a24] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--jy-text-primary)]">
                  Notifications
                </p>
                {unread > 0 && (
                  <p className="text-[11px] text-[var(--jy-text-muted)]">
                    {unread} unread
                  </p>
                )}
              </div>
              {unread > 0 && astrologerId && (
                <button
                  type="button"
                  onClick={() => markAll.mutate(astrologerId)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--jy-accent-gold)] hover:underline"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--jy-text-muted)]">
                  You&apos;re all caught up.
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {items.map((n) => (
                    <li
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3",
                        !n.read && "bg-[var(--jy-accent-gold)]/[0.04]",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1 inline-block h-2 w-2 shrink-0 rounded-full",
                          n.read
                            ? "bg-transparent"
                            : "bg-[var(--jy-accent-gold)]",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        {n.link ? (
                          <Link
                            href={n.link}
                            onClick={() => {
                              if (!n.read && astrologerId) {
                                markRead.mutate({
                                  astrologerId,
                                  id: n.id,
                                });
                              }
                              setOpen(false);
                            }}
                            className="block"
                          >
                            <p className="text-sm font-semibold text-[var(--jy-text-primary)]">
                              {n.title}
                            </p>
                            {n.body && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-[var(--jy-text-secondary)]">
                                {n.body}
                              </p>
                            )}
                          </Link>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-[var(--jy-text-primary)]">
                              {n.title}
                            </p>
                            {n.body && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-[var(--jy-text-secondary)]">
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
                      {!n.read && astrologerId && (
                        <button
                          type="button"
                          onClick={() =>
                            markRead.mutate({
                              astrologerId,
                              id: n.id,
                            })
                          }
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
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/jyotish/astrologer-dashboard/notifications");
              }}
              className="block w-full border-t border-white/10 bg-white/[0.02] px-4 py-2.5 text-center text-xs font-semibold text-[var(--jy-accent-gold)] hover:bg-white/5"
            >
              View all notifications →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
