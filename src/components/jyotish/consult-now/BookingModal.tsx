"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useStartChatSession } from "@/services/jyotish/sessions";

interface BookingModalProps {
  astrologer: any;
  onClose: () => void;
}

const consultTypes = [
  { value: "chat", label: "Chat", icon: "\u2709", desc: "Text-based consultation" },
  { value: "call", label: "Voice Call", icon: "\u260E", desc: "Voice consultation" },
  { value: "video", label: "Video Call", icon: "\u25B6", desc: "Face-to-face consultation" },
];

export function BookingModal({ astrologer: a, onClose }: BookingModalProps) {
  const router = useRouter();
  const startSession = useStartChatSession();
  const [step, setStep] = useState<"type" | "confirm">("type");
  const [selectedType, setSelectedType] = useState("chat");

  const handleConfirm = () => {
    startSession.mutate(
      { astrologerId: a._id || a.id, type: selectedType },
      {
        onSuccess: (data: any) => {
          const sessionId = data?.data?._id || data?.data?.id || data?._id;
          if (sessionId) {
            router.push(`/jyotish/chat/${sessionId}`);
          }
          onClose();
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="text-lg font-semibold">Book Consultation</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--jy-text-muted)] hover:bg-white/5"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Astrologer info */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[var(--jy-accent-gold)]/20 bg-[var(--jy-accent-purple)]/20 text-lg font-bold text-[var(--jy-accent-purple-light)]">
              {a.avatar ? (
                <img src={a.avatar} alt={a.name} className="h-full w-full object-cover" />
              ) : (
                a.name?.[0] || "A"
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">{a.name}</p>
              <p className="text-xs text-[var(--jy-text-muted)]">
                &#8377;{a.pricePerMin || 0}/min
              </p>
            </div>
          </div>

          {step === "type" && (
            <>
              <p className="mb-3 text-sm text-[var(--jy-text-secondary)]">
                Choose consultation type:
              </p>
              <div className="space-y-2">
                {consultTypes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setSelectedType(t.value)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      selectedType === t.value
                        ? "border-[var(--jy-accent-gold)]/50 bg-[var(--jy-accent-gold)]/5"
                        : "border-white/5 hover:border-white/10"
                    }`}
                  >
                    <span className="text-lg">{t.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-xs text-[var(--jy-text-muted)]">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep("confirm")}
                className="mt-5 w-full rounded-lg bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 py-2.5 text-sm font-semibold text-[var(--jy-bg-primary)]"
              >
                Continue
              </button>
            </>
          )}

          {step === "confirm" && (
            <>
              <div className="mb-5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--jy-text-muted)]">Astrologer</span>
                  <span>{a.name}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-[var(--jy-text-muted)]">Type</span>
                  <span className="capitalize">{selectedType}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-[var(--jy-text-muted)]">Rate</span>
                  <span>&#8377;{a.pricePerMin || 0}/min</span>
                </div>
              </div>
              <p className="mb-4 text-xs text-[var(--jy-text-muted)]">
                Amount will be deducted from your wallet. You can end the session
                anytime.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("type")}
                  className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-medium hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={startSession.isPending}
                  className="flex-1 rounded-lg bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 py-2.5 text-sm font-semibold text-[var(--jy-bg-primary)] disabled:opacity-50"
                >
                  {startSession.isPending ? "Starting..." : "Start Session"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingModal;
