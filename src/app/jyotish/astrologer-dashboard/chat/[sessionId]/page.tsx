"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChatWindow } from "@/components/jyotish/chat/ChatWindow";
import { useJyotishChatSession } from "@/services/jyotish/sessions";
import { Loader } from "@/components/ui/Loader";

export default function AstrologerChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session, isLoading } = useJyotishChatSession(sessionId);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader variant="section" message="Loading session..." />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-4xl flex-col px-4 py-4 sm:px-6">
      {/* Header */}
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-3">
        <Link
          href="/jyotish/astrologer-dashboard"
          className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-sm font-bold text-[var(--accent-primary)]">
          {session?.userName?.[0] || "U"}
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold">{session?.userName || "User"}</h2>
          <p className="text-xs text-[var(--text-muted)]">
            {session?.status === "active" ? "Session active" : session?.status || "Chat"}
          </p>
        </div>
      </div>

      <ChatWindow sessionId={sessionId} />
    </div>
  );
}
