"use client";

import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  useAdminNotificationsAll,
  useAdminMarkNotificationRead,
  useAdminMarkAllNotificationsRead,
  type JyotishNotification,
} from "@/services/jyotish/notifications";
import { cn } from "@/lib/utils";

/**
 * Full-page notifications feed for admins. Complements the header
 * bell (which only shows the 10 most recent) — this page lists the
 * whole history, each row links to the originating resource (an
 * edit-request, a chat session, etc.) and shows unread/read state.
 */
export default function AdminNotificationsPage() {
  const { data: items = [], isLoading } = useAdminNotificationsAll();
  const markRead = useAdminMarkNotificationRead();
  const markAll = useAdminMarkAllNotificationsRead();

  const unread = items.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Every alert from the Jyotish pipeline — edit requests, chat pings, and more."
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-[var(--text-muted)]">
          {items.length} total · {unread} unread
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => markAll.mutate()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--accent-primary)] hover:bg-[var(--bg-secondary)]"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">
            Loading notifications…
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
              <Bell className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              You&apos;re all caught up
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              New alerts will show up here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-primary)]">
            {items.map((n) => (
              <NotifRow
                key={n.id}
                n={n}
                onMarkRead={() => markRead.mutate(n.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function NotifRow({
  n,
  onMarkRead,
}: {
  n: JyotishNotification;
  onMarkRead: () => void;
}) {
  const body = (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full",
          n.read ? "bg-transparent" : "bg-[var(--accent-primary)]",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {n.title}
        </p>
        {n.body && (
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            {n.body}
          </p>
        )}
        <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
          {new Date(n.createdAt).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>
      {!n.read && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarkRead();
          }}
          className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Mark read"
          title="Mark read"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <li
      className={cn(
        "px-4 py-3 transition-colors hover:bg-[var(--bg-secondary)]",
        !n.read && "bg-[var(--accent-primary)]/5",
      )}
    >
      {n.link ? (
        <Link
          href={n.link}
          onClick={() => {
            if (!n.read) onMarkRead();
          }}
          className="block"
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}
