"use client";

import React, { useMemo, useState } from "react";
import { Sparkles, Zap } from "lucide-react";
import { useAstrologers } from "@/services/jyotish/profile";
import { AstrologerCard } from "./AstrologerCard";
import { BookingModal } from "./BookingModal";

const SPECIALIZATIONS = [
  "All",
  "Vedic Astrology",
  "Numerology",
  "Tarot Reading",
  "Vastu Shastra",
  "Palmistry",
  "Horoscope Matching",
];

/**
 * Deterministic-per-mount shuffle. Using a random seed fixed at mount time
 * means "refresh = new order" but the order doesn't jump while the user
 * interacts with filters.
 */
function shuffle<T>(list: T[], seed: number): T[] {
  const copy = [...list];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isPromoted(a: any): boolean {
  // Promoted astrologers show up on top of consult-now and jyotish home:
  //   - Explicit `isFeatured` / `promoted` flags (set manually by admin)
  //   - OR an `activeCampaign` relation filled by the backend when their
  //     ad-campaign is currently running in the shopper's window.
  return Boolean(
    a.isFeatured || a.promoted || a.activeCampaign || a.hasActiveAdCampaign,
  );
}

export function AstrologerGrid() {
  const { data: astrologers, isLoading } = useAstrologers();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [bookingAstrologer, setBookingAstrologer] = useState<any>(null);
  const [seed] = useState(() => Math.floor(Math.random() * 100000));

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

  const { promoted, onlineRest, offline } = useMemo(() => {
    const promoted: any[] = [];
    const onlineRest: any[] = [];
    const offline: any[] = [];
    for (const a of filtered) {
      if (isPromoted(a)) promoted.push(a);
      else if (a.isOnline) onlineRest.push(a);
      else offline.push(a);
    }
    return {
      promoted: shuffle(promoted, seed),
      onlineRest: shuffle(onlineRest, seed + 1),
      offline: shuffle(offline, seed + 2),
    };
  }, [filtered, seed]);

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
          {SPECIALIZATIONS.map((s) => (
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
        <>
          {promoted.length > 0 && (
            <Section
              title="Featured astrologers"
              subtitle="Currently promoted — live and ready to consult"
              icon={<Sparkles className="h-4 w-4" />}
              list={promoted}
              onBook={setBookingAstrologer}
              highlight
            />
          )}

          {onlineRest.length > 0 && (
            <Section
              title="Online now"
              subtitle="Available for instant chat or call"
              icon={<Zap className="h-4 w-4 text-emerald-400" />}
              list={onlineRest}
              onBook={setBookingAstrologer}
            />
          )}

          {offline.length > 0 && (
            <Section
              title="More astrologers"
              subtitle="Book a slot — they'll reach out when online"
              list={offline}
              onBook={setBookingAstrologer}
            />
          )}
        </>
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

function Section({
  title,
  subtitle,
  icon,
  list,
  onBook,
  highlight,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  list: any[];
  onBook: (a: any) => void;
  highlight?: boolean;
}) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-[var(--jy-accent-gold)]">
            {icon}
            <h2 className="text-sm font-bold uppercase tracking-wider">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-xs text-[var(--jy-text-muted)]">{subtitle}</p>
          )}
        </div>
      </div>
      <div
        className={
          highlight
            ? "grid gap-4 rounded-2xl border border-[var(--jy-accent-gold)]/25 bg-[var(--jy-accent-gold)]/5 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            : "grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        }
      >
        {list.map((a: any) => (
          <AstrologerCard
            key={a._id || a.id}
            astrologer={a}
            onBook={onBook}
          />
        ))}
      </div>
    </div>
  );
}

export default AstrologerGrid;
