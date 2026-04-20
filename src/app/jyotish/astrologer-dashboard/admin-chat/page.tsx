"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import toast from "react-hot-toast";

/**
 * Astrologer ↔ Admin direct chat.
 *
 * This is a plain support chat (not a billable session). The UI is ready —
 * wiring to a backend `admin_support_chat` table with a socket channel is
 * queued in the backend work. For now messages stay in local state so
 * astrologers can preview the flow; switching to socket.io takes an hour
 * once the backend endpoints exist.
 */
interface Message {
  id: string;
  from: "astrologer" | "admin";
  text: string;
  at: number;
}

export default function AstrologerAdminChatPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      from: "admin",
      text: `Hi ${user?.name?.split(" ")[0] ?? "there"}, our team is here to help with payouts, profile reviews or anything else. How can we support you?`,
      at: Date.now() - 1000 * 60 * 60,
    },
  ]);
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `m${prev.length + 1}`,
        from: "astrologer",
        text,
        at: Date.now(),
      },
    ]);
    setDraft("");
    toast("Message queued — will send to admin once live chat is enabled.", {
      icon: "💬",
    });
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-3xl flex-col px-4 py-6 sm:px-6">
      <Link
        href="/jyotish/astrologer-dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--jy-text-secondary)] hover:text-[var(--jy-accent-gold)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)]">
        <header className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--jy-accent-gold)]/15 text-[var(--jy-accent-gold)]">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--jy-text-primary)]">
              Hecate Admin Support
            </p>
            <p className="text-xs text-[var(--jy-text-muted)]">
              Typically replies within a few hours
            </p>
          </div>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.map((m) => {
            const mine = m.from === "astrologer";
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? "rounded-br-md bg-[var(--jy-accent-gold)]/20 text-[var(--jy-text-primary)]"
                      : "rounded-bl-md bg-white/5 text-[var(--jy-text-secondary)]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <p className="mt-1 text-right text-[10px] text-[var(--jy-text-muted)]">
                    {new Date(m.at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <footer className="flex items-center gap-2 border-t border-white/10 px-4 py-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Write a message to admin..."
            className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-muted)] outline-none focus:border-[var(--jy-accent-gold)]/40"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--jy-accent-gold)] text-[var(--jy-bg-primary)] transition-opacity disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </footer>
      </div>
    </div>
  );
}
