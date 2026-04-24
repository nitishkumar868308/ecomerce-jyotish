"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Send, Loader2, Smile } from "lucide-react";
import { Theme, EmojiStyle, type EmojiClickData } from "emoji-picker-react";
import { cn } from "@/lib/utils";

// The picker ships with its own heavy CSS + emoji assets — lazy-load it
// client-side so it's not in the initial dashboard bundle. SSR off
// because it reaches for `window` during init.
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface ChatComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  pending?: boolean;
  placeholder?: string;
  submitLabel?: string;
  /** Fired (debounced internally) whenever the user types — lets the
   *  parent post a "typing…" pulse to the backend. */
  onTyping?: () => void;
  /** Jyotish vs admin theme — just swaps the send button colour. */
  variant?: "jyotish" | "admin";
}

/**
 * Shared composer for both the astrologer-side and admin-side chat.
 *
 * Handles:
 *   - Auto-growing textarea
 *   - Enter to send, Shift+Enter for newline
 *   - Inline emoji picker (tap smiley → strip of common emojis)
 *   - Typing notifier (debounced to ~1s)
 *
 * The read-receipt + bubble rendering stays in the parent because it
 * depends on whose message it is. Composer just owns what the current
 * user types.
 */
export function ChatComposer({
  value,
  onChange,
  onSend,
  pending,
  placeholder = "Type your message…",
  submitLabel = "Send",
  onTyping,
  variant = "jyotish",
}: ChatComposerProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = "0px";
    t.style.height = Math.min(t.scrollHeight, 128) + "px";
  }, [value]);

  // Debounce typing pings — we don't want to blast the backend every
  // keystroke. 1s gap matches what a reader would tolerate seeing
  // "typing…" flicker.
  const fireTyping = () => {
    if (!onTyping) return;
    if (typingTimerRef.current) return; // already scheduled
    typingTimerRef.current = setTimeout(() => {
      typingTimerRef.current = null;
      onTyping();
    }, 1000);
  };
  useEffect(
    () => () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    },
    [],
  );

  const insertEmoji = (emoji: string) => {
    onChange(value + emoji);
    textareaRef.current?.focus();
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (pending) return;
    if (!value.trim()) return;
    onSend();
  };

  const sendBtn =
    variant === "admin"
      ? "bg-[var(--accent-primary)] text-white"
      : "bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 text-[var(--jy-bg-primary)] shadow-md";

  return (
    <div className="relative">
      {emojiOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setEmojiOpen(false)}
          />
          <div className="absolute bottom-full left-3 z-20 mb-2 overflow-hidden rounded-2xl shadow-2xl">
            <EmojiPicker
              theme={variant === "admin" ? Theme.AUTO : Theme.DARK}
              emojiStyle={EmojiStyle.NATIVE}
              lazyLoadEmojis
              searchPlaceHolder="Search emoji…"
              width={320}
              height={380}
              previewConfig={{ showPreview: false }}
              onEmojiClick={(data: EmojiClickData) => {
                insertEmoji(data.emoji);
                setEmojiOpen(false);
              }}
            />
          </div>
        </>
      )}

      <form
        onSubmit={submit}
        className={cn(
          "flex items-end gap-2 border-t p-3 sm:p-4",
          variant === "admin"
            ? "border-[var(--border-primary)] bg-[var(--bg-secondary)]"
            : "border-white/10 bg-white/[0.02]",
        )}
      >
        <button
          type="button"
          onClick={() => setEmojiOpen((v) => !v)}
          className={cn(
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
            variant === "admin"
              ? "border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              : "border-white/10 bg-white/5 text-[var(--jy-text-secondary)] hover:text-[var(--jy-accent-gold)]",
            emojiOpen &&
              (variant === "admin"
                ? "text-[var(--accent-primary)]"
                : "text-[var(--jy-accent-gold)]"),
          )}
          aria-label="Emoji"
        >
          <Smile className="h-4 w-4" />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            fireTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              submit(e);
            }
          }}
          placeholder={placeholder}
          rows={1}
          className={cn(
            "max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border px-3 py-2.5 text-sm outline-none",
            variant === "admin"
              ? "border-[var(--border-primary)] bg-[var(--bg-primary)] focus:border-[var(--accent-primary)]"
              : "border-white/10 bg-white/5 text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-faint)] focus:border-[var(--jy-accent-gold)]/50",
          )}
        />

        <button
          type="submit"
          disabled={!value.trim() || pending}
          className={cn(
            "inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold disabled:opacity-50",
            sendBtn,
          )}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{submitLabel}</span>
        </button>
      </form>
    </div>
  );
}

export default ChatComposer;
