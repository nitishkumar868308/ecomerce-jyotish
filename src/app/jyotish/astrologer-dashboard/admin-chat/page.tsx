"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Shield, Sparkles, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  useAstrologerAdminChat,
  useAstrologerSendAdminChat,
  useAstrologerMarkAdminChatRead,
  type AdminChatMessage,
} from "@/services/jyotish/admin-chat";
import { ChatComposer } from "@/components/jyotish/dashboard/ChatComposer";

/**
 * Astrologer-facing support chat. Single thread per astrologer, polled
 * every 8s for new admin replies. Mark-as-read fires on mount and each
 * time the message list length changes so the dashboard unread badge
 * resets immediately when the astrologer is viewing the page.
 */
export default function AstrologerAdminChatPage() {
  const { user } = useAuthStore();
  const astrologerId = user?.id as number | undefined;
  const { data: messages, isLoading } = useAstrologerAdminChat(astrologerId);
  const send = useAstrologerSendAdminChat();
  const markRead = useAstrologerMarkAdminChatRead();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!astrologerId) return;
    markRead.mutate(astrologerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [astrologerId, messages?.length]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.length]);

  const handleSend = async () => {
    if (!astrologerId) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    await send.mutateAsync({ astrologerId, text: trimmed });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      <header className="mb-5 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--jy-accent-purple)] to-[var(--jy-accent-gold)] text-white">
          <Shield className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-[var(--jy-text-primary)] sm:text-2xl">
            Chat with Admin
          </h1>
          <p className="text-sm text-[var(--jy-text-muted)]">
            Direct line to the Hecate admin team. Replies usually within a day.
          </p>
        </div>
      </header>

      <div className="flex h-[calc(100vh-240px)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--jy-bg-card)]">
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--jy-text-muted)]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
              conversation…
            </div>
          ) : !messages || messages.length === 0 ? (
            <EmptyState />
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
          <div ref={bottomRef} />
        </div>

        <ChatComposer
          value={text}
          onChange={setText}
          onSend={handleSend}
          pending={send.isPending}
          variant="jyotish"
        />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: AdminChatMessage }) {
  const mine = message.senderType === "ASTROLOGER";
  return (
    <div className={cn("flex gap-2", mine ? "flex-row-reverse" : "flex-row")}>
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          mine
            ? "bg-[var(--jy-accent-gold)]/20 text-[var(--jy-accent-gold)]"
            : "bg-[var(--jy-accent-purple)]/20 text-[var(--jy-accent-purple-light)]",
        )}
      >
        {mine ? <Sparkles className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
      </span>
      <div className={cn("flex max-w-[78%] flex-col", mine && "items-end")}>
        <div
          className={cn(
            "whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm",
            mine
              ? "rounded-br-sm border border-[var(--jy-accent-gold)]/30 bg-gradient-to-br from-[var(--jy-accent-gold)]/20 to-amber-500/10 text-[var(--jy-text-primary)]"
              : "rounded-bl-sm border border-white/10 bg-white/[0.04] text-[var(--jy-text-primary)]",
          )}
        >
          {message.text}
        </div>
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-[10px] uppercase tracking-wider",
            mine
              ? "text-[var(--jy-accent-gold)]/70"
              : "text-[var(--jy-text-muted)]",
          )}
        >
          {mine ? "You" : "Admin"} ·{" "}
          {new Date(message.createdAt).toLocaleString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "short",
          })}
          {/* Read receipt — single gray tick when sent, double gold
              tick once admin opens the thread (readByAdmin flips). */}
          {mine &&
            (message.readByAdmin ? (
              <CheckCheck className="h-3 w-3 text-[var(--jy-accent-gold)]" />
            ) : (
              <Check className="h-3 w-3 text-[var(--jy-text-muted)]" />
            ))}
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/10 text-[var(--jy-accent-gold)]">
        <MessageCircle className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold text-[var(--jy-text-primary)]">
        Say hi to the admin team
      </p>
      <p className="mt-1 max-w-xs text-xs text-[var(--jy-text-muted)]">
        Use this channel to raise profile edits, payout questions or
        anything else. We usually reply within a business day.
      </p>
    </div>
  );
}
