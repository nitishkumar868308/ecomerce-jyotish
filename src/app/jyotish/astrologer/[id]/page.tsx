"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAstrologerProfile } from "@/services/jyotish/profile";
import { BookingModal } from "@/components/jyotish/consult-now/BookingModal";

export default function AstrologerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: astrologer, isLoading } = useAstrologerProfile(id);
  const [showBooking, setShowBooking] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-white/5" />
            <div className="space-y-3">
              <div className="h-6 w-48 rounded bg-white/5" />
              <div className="h-4 w-32 rounded bg-white/5" />
            </div>
          </div>
          <div className="h-40 rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (!astrologer) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg font-semibold">Astrologer not found</p>
        <Link
          href="/jyotish/consult-now"
          className="text-sm text-[var(--jy-accent-gold)] underline"
        >
          Browse all astrologers
        </Link>
      </div>
    );
  }

  const a = astrologer;

  return (
    <>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Back link */}
        <Link
          href="/jyotish/consult-now"
          className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--jy-text-muted)] hover:text-[var(--jy-accent-gold)]"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Astrologers
        </Link>

        {/* Profile header */}
        <div className="mb-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--jy-accent-gold)]/20">
              {a.avatar ? (
                <img src={a.avatar} alt={a.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--jy-accent-purple)]/20 text-3xl font-bold text-[var(--jy-accent-purple-light)]">
                  {a.name?.[0] || "A"}
                </div>
              )}
            </div>
            {a.isOnline && (
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-[var(--jy-bg-primary)] bg-[var(--jy-online)]" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{a.name}</h1>
            <p className="text-sm text-[var(--jy-text-muted)]">
              {(a.specializations ?? []).join(" \u2022 ")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-[var(--jy-accent-gold)]">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {a.rating?.toFixed(1) || "N/A"}
              </span>
              {a.experience && (
                <span className="text-[var(--jy-text-secondary)]">
                  {a.experience} yrs experience
                </span>
              )}
              {a.languages && (
                <span className="text-[var(--jy-text-secondary)]">
                  {(a.languages as string[]).join(", ")}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowBooking(true)}
            className="shrink-0 rounded-xl bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 px-6 py-3 text-sm font-semibold text-[var(--jy-bg-primary)] shadow-lg shadow-amber-500/20 transition-transform hover:scale-105"
          >
            Book Consultation
          </button>
        </div>

        {/* Bio */}
        {a.bio && (
          <div className="mb-8 rounded-xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)] p-6">
            <h2 className="mb-3 text-lg font-semibold">About</h2>
            <p className="text-sm leading-relaxed text-[var(--jy-text-secondary)]">
              {a.bio}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Consultations", value: a.totalSessions || 0 },
            { label: "Rating", value: a.rating?.toFixed(1) || "N/A" },
            { label: "Experience", value: `${a.experience || 0} yrs` },
            { label: "Price", value: `\u20B9${a.pricePerMin || 0}/min` },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)] p-4 text-center"
            >
              <div className="text-xl font-bold text-[var(--jy-accent-gold)]">
                {s.value}
              </div>
              <div className="text-xs text-[var(--jy-text-muted)]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Specializations */}
        {(a.specializations ?? []).length > 0 && (
          <div className="mb-8 rounded-xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)] p-6">
            <h2 className="mb-3 text-lg font-semibold">Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {(a.specializations as string[]).map((s: string) => (
                <span
                  key={s}
                  className="rounded-full bg-[var(--jy-accent-gold)]/10 px-3 py-1 text-xs font-medium text-[var(--jy-accent-gold)]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {showBooking && (
        <BookingModal
          astrologer={a}
          onClose={() => setShowBooking(false)}
        />
      )}
    </>
  );
}
