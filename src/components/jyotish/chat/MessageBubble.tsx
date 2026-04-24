"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: string;
  sender: "self" | "other";
  timestamp?: string;
  senderName?: string;
  /** Optimistic local bubble waiting for server ack — slightly faded
   *  with a subtle clock marker so the sender can tell it hasn't
   *  hit the server yet. */
  pending?: boolean;
}

export function MessageBubble({
  message,
  sender,
  timestamp,
  senderName,
  pending,
}: MessageBubbleProps) {
  const isSelf = sender === "self";

  return (
    <div className={cn("flex", isSelf ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[75%] sm:max-w-[65%]")}>
        {senderName && !isSelf && (
          <p className="mb-0.5 text-xs font-medium text-[var(--jy-accent-gold)]">
            {senderName}
          </p>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-opacity",
            isSelf
              ? "rounded-br-md bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 text-[var(--jy-bg-primary)]"
              : "rounded-bl-md border border-white/5 bg-[var(--jy-bg-card)] text-[var(--jy-text-primary)]",
            pending && "opacity-70",
          )}
        >
          {message}
        </div>
        {(timestamp || pending) && (
          <p
            className={cn(
              "mt-1 inline-flex items-center gap-1 text-[10px] text-[var(--jy-text-muted)]",
              isSelf ? "float-right clear-both" : "float-left clear-both",
            )}
          >
            {timestamp}
            {pending && <span className="opacity-70">· sending…</span>}
          </p>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
