"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MessageCircle, Search, Check, CheckCheck } from "lucide-react";
import { ChatComposer } from "@/components/jyotish/dashboard/ChatComposer";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { resolveAssetUrl } from "@/lib/assetUrl";
import {
  useAdminChatInbox,
  useAdminChatThread,
  useAdminSendChat,
  useAdminMarkChatRead,
  type AdminChatMessage,
} from "@/services/jyotish/admin-chat";

/**
 * Admin-side chat console. Two-pane layout:
 *   - Left: inbox (every astrologer thread, sorted by last activity,
 *     with unread-by-admin count).
 *   - Right: selected thread's messages + composer.
 * Mobile stacks: inbox collapses to a back-arrow when a thread is open.
 * Polling (inbox 10s, thread 8s) comes from the hooks — no local timer.
 */
export default function AdminAstrologerChatsPage() {
  const { data: threads, isLoading } = useAdminChatInbox();
  const markRead = useAdminMarkChatRead();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads ?? [];
    return (threads ?? []).filter((t) =>
      [t.astrologer.fullName, t.astrologer.displayName, t.astrologer.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [threads, search]);

  useEffect(() => {
    if (!selectedId) return;
    markRead.mutate(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <div>
      <PageHeader
        title="Astrologer chats"
        description="Direct messages between admin and each astrologer."
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div
          className={cn(
            "rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden",
            // On mobile we hide the inbox once a thread is open so the
            // conversation has the full viewport.
            selectedId != null && "hidden lg:block",
          )}
        >
          <div className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search astrologer…"
                className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 pl-9 text-sm outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>
          <div className="max-h-[65vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-6 text-sm text-[var(--text-muted)]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : filtered.length === 0 ? (
              <p className="p-6 text-center text-xs text-[var(--text-muted)]">
                No threads yet. Astrologers will appear here after their first
                message.
              </p>
            ) : (
              <ul>
                {filtered.map((t) => {
                  const src = t.astrologer.profile?.image
                    ? resolveAssetUrl(t.astrologer.profile.image) ||
                      t.astrologer.profile.image
                    : "";
                  const active = selectedId === t.astrologer.id;
                  const last = t.lastMessage;
                  return (
                    <li key={t.astrologer.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(t.astrologer.id)}
                        className={cn(
                          "flex w-full items-start gap-3 border-b border-[var(--border-primary)] px-3 py-3 text-left transition-colors",
                          active
                            ? "bg-[var(--accent-primary)]/10"
                            : "hover:bg-[var(--bg-secondary)]",
                        )}
                      >
                        {src ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={src}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-sm font-bold text-[var(--text-secondary)]">
                            {(
                              t.astrologer.displayName ||
                              t.astrologer.fullName ||
                              "A"
                            ).slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                              {t.astrologer.displayName ||
                                t.astrologer.fullName ||
                                "(unnamed)"}
                            </p>
                            {last && (
                              <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                                {new Date(last.createdAt).toLocaleString(
                                  undefined,
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                            {last
                              ? `${last.senderType === "ADMIN" ? "You: " : ""}${last.text}`
                              : "No messages yet."}
                          </p>
                        </div>
                        {t.unreadForAdmin > 0 && (
                          <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)] px-1 text-[10px] font-bold text-white">
                            {t.unreadForAdmin}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div
          className={cn(
            "rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden",
            selectedId == null && "hidden lg:block",
          )}
        >
          {selectedId == null ? (
            <EmptyRightPane />
          ) : (
            <ChatPane
              astrologerId={selectedId}
              onBack={() => setSelectedId(null)}
              astrologerName={
                threads?.find((t) => t.astrologer.id === selectedId)?.astrologer
                  .displayName ??
                threads?.find((t) => t.astrologer.id === selectedId)?.astrologer
                  .fullName ??
                ""
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ChatPane({
  astrologerId,
  astrologerName,
  onBack,
}: {
  astrologerId: number;
  astrologerName: string;
  onBack: () => void;
}) {
  const { data: messages, isLoading } = useAdminChatThread(astrologerId);
  const send = useAdminSendChat();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    await send.mutateAsync({ astrologerId, text: trimmed });
  };

  return (
    <div className="flex h-[65vh] flex-col">
      <header className="flex items-center gap-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] lg:hidden"
          aria-label="Back to inbox"
        >
          ←
        </button>
        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {astrologerName || "Astrologer"}
        </p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
            conversation…
          </div>
        ) : !messages || messages.length === 0 ? (
          <p className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">
            No messages in this thread yet.
          </p>
        ) : (
          messages.map((m) => <AdminBubble key={m.id} message={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      <ChatComposer
        value={text}
        onChange={setText}
        onSend={handleSend}
        pending={send.isPending}
        placeholder="Type your reply…"
        submitLabel="Send"
        variant="admin"
      />
    </div>
  );
}

function AdminBubble({ message }: { message: AdminChatMessage }) {
  const mine = message.senderType === "ADMIN";
  return (
    <div
      className={cn(
        "flex",
        mine ? "justify-end" : "justify-start",
      )}
    >
      <div className={cn("flex max-w-[78%] flex-col", mine && "items-end")}>
        <div
          className={cn(
            "whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm",
            mine
              ? "rounded-br-sm bg-[var(--accent-primary)] text-white"
              : "rounded-bl-sm border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)]",
          )}
        >
          {message.text}
        </div>
        <p className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
          {mine ? "Admin" : "Astrologer"} ·{" "}
          {new Date(message.createdAt).toLocaleString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "short",
          })}
          {/* Read receipt on admin's sent messages — single gray when
              awaiting, double primary tick once astrologer opens. */}
          {mine &&
            (message.readByAstro ? (
              <CheckCheck className="h-3 w-3 text-[var(--accent-primary)]" />
            ) : (
              <Check className="h-3 w-3 text-[var(--text-muted)]" />
            ))}
        </p>
      </div>
    </div>
  );
}

function EmptyRightPane() {
  return (
    <div className="flex h-[65vh] flex-col items-center justify-center text-center">
      <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
        <MessageCircle className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        Pick a conversation
      </p>
      <p className="mt-1 max-w-xs text-xs text-[var(--text-muted)]">
        Select an astrologer from the left inbox to view messages and reply.
      </p>
    </div>
  );
}
