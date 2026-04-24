"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  useChatMessages,
  useSendMessage,
  useSendTyping,
} from "@/services/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { MessageBubble } from "./MessageBubble";
import { ChatComposer } from "@/components/jyotish/dashboard/ChatComposer";
import { Loader } from "@/components/ui/Loader";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  sessionId: string;
  /** Whether the other party is currently typing — driven by the
   *  live-status poll in the parent. */
  otherTyping?: boolean;
  /** Show a faint "Session ended" overlay instead of the composer. */
  readOnly?: boolean;
}

/**
 * In-session chat body. The parent page owns the header + billing
 * bar; this component is the message list + composer only, so both
 * user and astrologer chat pages can share it without duplicating
 * bubble/composer logic.
 */
export function ChatWindow({
  sessionId,
  otherTyping,
  readOnly,
}: ChatWindowProps) {
  const { user } = useAuthStore();
  const { data: messages, isLoading } = useChatMessages(sessionId);
  const sendMessage = useSendMessage();
  const sendTyping = useSendTyping();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  const role = String((user as { role?: string } | null)?.role ?? "").toUpperCase();
  const senderType: "USER" | "ASTROLOGER" =
    role === "ASTROLOGER" ? "ASTROLOGER" : "USER";
  const senderId = Number(
    (user as { id?: number | string } | null)?.id ??
      (user as { _id?: number | string } | null)?._id,
  );

  // Auto-scroll to bottom on new messages (including our own optimistic
  // ones). Uses a micro-delay so the DOM has the new bubble before we
  // scroll.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, [messages, otherTyping]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || !senderId || readOnly) return;
    sendMessage.mutate({
      sessionId,
      text: trimmed,
      senderType,
      senderId,
    });
    setDraft("");
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader variant="section" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-2.5 overflow-y-auto rounded-2xl border border-white/5 bg-gradient-to-b from-[var(--jy-bg-card)]/70 to-[var(--jy-bg-card)]/30 p-4 backdrop-blur-sm"
      >
        {(!messages || messages.length === 0) && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[var(--jy-text-muted)]">
              No messages yet — say hello ✨
            </p>
          </div>
        )}
        {(messages ?? []).map((msg: any, i: number) => {
          const isSelf =
            msg.senderType === senderType ||
            msg.senderId === senderId ||
            msg.sender === "self";
          return (
            <MessageBubble
              key={msg._id || msg.id || i}
              message={msg.message || msg.text || msg.content || ""}
              sender={isSelf ? "self" : "other"}
              senderName={!isSelf ? msg.senderName : undefined}
              timestamp={
                msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : undefined
              }
              pending={msg.pending}
            />
          );
        })}
        {otherTyping && <TypingIndicator />}
      </div>

      <div className={cn("mt-3", readOnly && "pointer-events-none opacity-60")}>
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSend={handleSend}
          pending={sendMessage.isPending}
          onTyping={() => {
            if (!readOnly) sendTyping.mutate({ sessionId, senderType });
          }}
          variant="jyotish"
          placeholder={
            readOnly ? "This session has ended" : "Type your message…"
          }
        />
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/5 bg-[var(--jy-bg-card)] px-3.5 py-2 text-xs text-[var(--jy-text-muted)]">
        <span className="inline-flex gap-0.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--jy-accent-gold)] [animation-delay:-0.32s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--jy-accent-gold)] [animation-delay:-0.16s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--jy-accent-gold)]" />
        </span>
        typing…
      </div>
    </div>
  );
}

export default ChatWindow;
