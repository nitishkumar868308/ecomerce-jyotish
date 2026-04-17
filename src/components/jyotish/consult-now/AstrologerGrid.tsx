"use client";

import React, { useState, useMemo } from "react";
import { useAstrologers } from "@/services/jyotish/profile";
import { AstrologerCard } from "./AstrologerCard";
import { BookingModal } from "./BookingModal";

const specializations = [
  "All",
  "Vedic Astrology",
  "Numerology",
  "Tarot Reading",
  "Vastu Shastra",
  "Palmistry",
  "Horoscope Matching",
];

export function AstrologerGrid() {
  const { data: astrologers, isLoading } = useAstrologers();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [bookingAstrologer, setBookingAstrologer] = useState<any>(null);

  const filtered = useMemo(() => {
    let list = astrologers ?? [];
    if (filter !== "All") {
      list = list.filter((a: any) =>
        (a.specializations ?? []).some(
          (s: string) => s.toLowerCase() === filter.toLowerCase(),
        ),
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a: any) =>
          a.name?.toLowerCase().includes(q) ||
          (a.specializations ?? []).some((s: string) =>
            s.toLowerCase().includes(q),
          ),
      );
    }
    return list;
  }, [astrologers, filter, search]);

  return (
    <>
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search astrologers..."
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-muted)] outline-none focus:border-[var(--jy-accent-gold)]/50 sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {specializations.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === s
                  ? "bg-[var(--jy-accent-gold)] text-[var(--jy-bg-primary)]"
                  : "bg-white/5 text-[var(--jy-text-secondary)] hover:bg-white/10"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)] p-5"
            >
              <div className="mx-auto mb-3 h-16 w-16 rounded-full shimmer" />
              <div className="mx-auto mb-2 h-4 w-24 rounded shimmer" />
              <div className="mx-auto mb-2 h-3 w-32 rounded shimmer" />
              <div className="mx-auto h-8 w-full rounded-lg shimmer" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg font-semibold text-[var(--jy-text-secondary)]">
            No astrologers found
          </p>
          <p className="mt-1 text-sm text-[var(--jy-text-muted)]">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((a: any) => (
            <AstrologerCard
              key={a._id || a.id}
              astrologer={a}
              onBook={setBookingAstrologer}
            />
          ))}
        </div>
      )}

      {bookingAstrologer && (
        <BookingModal
          astrologer={bookingAstrologer}
          onClose={() => setBookingAstrologer(null)}
        />
      )}
    </>
  );
}

export default AstrologerGrid;
