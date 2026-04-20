"use client";

import React, { useRef, useEffect } from "react";
import { useChatMessages, useSendMessage } from "@/services/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { Loader } from "@/components/ui/Loader";

interface ChatWindowProps {
  sessionId: string;
}

export function ChatWindow({ sessionId }: ChatWindowProps) {
  const { user } = useAuthStore();
  const { data: messages, isLoading } = useChatMessages(sessionId);
  const sendMessage = useSendMessage();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (message: string) => {
    sendMessage.mutate({ sessionId, message });
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
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)]/50 p-4"
      >
        {(!messages || messages.length === 0) && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[var(--jy-text-muted)]">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}
        {(messages ?? []).map((msg: any, i: number) => {
          const isSelf =
            msg.senderId === user?.id ||
            msg.senderId === user?._id ||
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
            />
          );
        })}
      </div>

      {/* Input */}
      <div className="mt-3">
        <ChatInput onSend={handleSend} disabled={sendMessage.isPending} />
      </div>
    </div>
  );
}

export default ChatWindow;
