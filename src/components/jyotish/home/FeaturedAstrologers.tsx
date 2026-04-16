"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { useAstrologers } from "@/services/jyotish/profile";

export function FeaturedAstrologers() {
  const { data: astrologers, isLoading } = useAstrologers();
  const scrollRef = useRef<HTMLDivElement>(null);

  const featured = (astrologers ?? []).slice(0, 8);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
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
              onClick={() => scroll("left")}
              className="rounded-full border border-white/10 p-2 text-[var(--jy-text-secondary)] transition-colors hover:border-white/20 hover:text-white"
              aria-label="Scroll left"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="rounded-full border border-white/10 p-2 text-[var(--jy-text-secondary)] transition-colors hover:border-white/20 hover:text-white"
              aria-label="Scroll right"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[260px] flex-shrink-0 rounded-xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)] p-5"
              >
                <div className="mx-auto mb-4 h-20 w-20 rounded-full shimmer" />
                <div className="mx-auto mb-2 h-4 w-28 rounded shimmer" />
                <div className="mx-auto mb-4 h-3 w-36 rounded shimmer" />
                <div className="mx-auto h-8 w-24 rounded-lg shimmer" />
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
          >
            {featured.map((a: any) => (
              <Link
                key={a._id || a.id}
                href={`/jyotish/astrologer/${a._id || a.id}`}
                className="group min-w-[260px] flex-shrink-0 rounded-xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)] p-5 text-center transition-all hover:border-[var(--jy-accent-gold)]/30 hover:shadow-lg hover:shadow-[var(--jy-accent-gold)]/5"
              >
                <div className="relative mx-auto mb-4 h-20 w-20">
                  <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-[var(--jy-accent-gold)]/20">
                    {a.avatar ? (
                      <img
                        src={a.avatar}
                        alt={a.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[var(--jy-accent-purple)]/20 text-2xl font-bold text-[var(--jy-accent-purple-light)]">
                        {a.name?.[0] || "A"}
                      </div>
                    )}
                  </div>
                  {a.isOnline && (
                    <span className="absolute bottom-0 right-1 h-4 w-4 rounded-full border-2 border-[var(--jy-bg-primary)] bg-[var(--jy-online)]" />
                  )}
                </div>
                <h3 className="mb-1 text-sm font-semibold text-[var(--jy-text-primary)] group-hover:text-[var(--jy-accent-gold)]">
                  {a.name}
                </h3>
                <p className="mb-2 text-xs text-[var(--jy-text-muted)]">
                  {(a.specializations ?? []).slice(0, 2).join(", ")}
                </p>
                <div className="mb-3 flex items-center justify-center gap-1 text-xs text-[var(--jy-accent-gold)]">
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>{a.rating?.toFixed(1) || "N/A"}</span>
                </div>
                <span className="inline-block rounded-lg bg-[var(--jy-accent-gold)]/10 px-3 py-1 text-xs font-medium text-[var(--jy-accent-gold)]">
                  Consult Now
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedAstrologers;
