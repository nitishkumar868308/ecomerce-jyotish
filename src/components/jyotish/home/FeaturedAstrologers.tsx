"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAstrologers } from "@/services/jyotish/profile";
import { AstrologerCard } from "@/components/jyotish/consult-now/AstrologerCard";

/**
 * Featured row on /jyotish. Reuses the same AstrologerCard the
 * consult-now grid renders so the two surfaces look identical — the
 * earlier bespoke card here was reading `a.name` / `a.avatar` /
 * `a.pricePerMin` which never exist on the API response, which is why
 * shoppers saw the "A / N/A / Consult Now" stub on every card.
 */
export function FeaturedAstrologers() {
  const { data: astrologers, isLoading } = useAstrologers();
  const scrollRef = useRef<HTMLDivElement>(null);

  const featured = (astrologers ?? []).slice(0, 8);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Featured{" "}
              <span className="text-[var(--jy-accent-gold)]">Astrologers</span>
            </h2>
            <p className="mt-1 text-sm text-[var(--jy-text-muted)]">
              Top-rated astrologers available for consultation
            </p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[var(--jy-text-secondary)] transition-colors hover:border-[var(--jy-accent-gold)]/40 hover:text-[var(--jy-accent-gold)]"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[var(--jy-text-secondary)] transition-colors hover:border-[var(--jy-accent-gold)]/40 hover:text-[var(--jy-accent-gold)]"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[280px] flex-shrink-0 rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-5"
              >
                <div className="flex gap-3">
                  <div className="h-16 w-16 rounded-2xl shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 rounded shimmer" />
                    <div className="h-3 w-36 rounded shimmer" />
                  </div>
                </div>
                <div className="mt-4 h-8 rounded-lg shimmer" />
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-10 text-center text-sm text-[var(--jy-text-muted)]">
            No astrologers published yet — check back soon.
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          >
            {featured.map((a: any) => (
              <div
                key={a._id || a.id}
                className="min-w-[280px] max-w-[320px] flex-shrink-0 snap-start"
              >
                {/* No `onBook` — the card's direct-launch flow handles
                    wallet check + session ring on its own. */}
                <AstrologerCard astrologer={a} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedAstrologers;
