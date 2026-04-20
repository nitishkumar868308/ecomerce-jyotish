"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ChatWindow } from "@/components/jyotish/chat/ChatWindow";
import { SessionBillingOverlay } from "@/components/jyotish/chat/SessionBillingOverlay";
import { useJyotishChatSession } from "@/services/jyotish/sessions";
import { Loader } from "@/components/ui/Loader";

export default function JyotishChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session, isLoading } = useJyotishChatSession(sessionId);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader variant="section" message="Connecting to your astrologer..." />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-4 sm:px-6">
      {/* Session header */}
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)] px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--jy-accent-purple)]/20 text-sm font-bold text-[var(--jy-accent-purple-light)]">
          {session?.astrologerName?.[0] || "A"}
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold">
            {session?.astrologerName || "Astrologer"}
          </h2>
          <p className="text-xs text-[var(--jy-text-muted)]">
            {session?.status === "active" ? "Session active" : session?.status || "Chat"}
          </p>
        </div>
        {session?.status === "active" && (
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--jy-online)]" />
        )}
      </div>

      <SessionBillingOverlay sessionId={sessionId} session={session} />

      {/* Chat */}
      <ChatWindow sessionId={sessionId} />
    </div>
  );
}
