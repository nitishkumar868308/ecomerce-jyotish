"use client";

import React from "react";
import Link from "next/link";

interface AstrologerCardProps {
  astrologer: any;
  onBook?: (astrologer: any) => void;
}

export function AstrologerCard({ astrologer: a, onBook }: AstrologerCardProps) {
  return (
    <div className="group rounded-xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)] p-5 transition-all hover:border-[var(--jy-accent-gold)]/30 hover:shadow-lg hover:shadow-[var(--jy-accent-gold)]/5">
      <Link
        href={`/jyotish/astrologer/${a._id || a.id}`}
        className="flex flex-col items-center text-center"
      >
        <div className="relative mb-3">
          <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-[var(--jy-accent-gold)]/20">
            {a.avatar ? (
              <img src={a.avatar} alt={a.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--jy-accent-purple)]/20 text-xl font-bold text-[var(--jy-accent-purple-light)]">
                {a.name?.[0] || "A"}
              </div>
            )}
          </div>
          {a.isOnline && (
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[var(--jy-bg-card)] bg-[var(--jy-online)]" />
          )}
        </div>

        <h3 className="mb-0.5 text-sm font-semibold group-hover:text-[var(--jy-accent-gold)]">
          {a.name}
        </h3>
        <p className="mb-1.5 text-xs text-[var(--jy-text-muted)]">
          {(a.specializations ?? []).slice(0, 2).join(", ")}
        </p>

        <div className="mb-1 flex items-center gap-1 text-xs text-[var(--jy-accent-gold)]">
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>{a.rating?.toFixed(1) || "N/A"}</span>
          {a.experience && (
            <span className="text-[var(--jy-text-muted)]">
              {" \u2022 "}{a.experience} yrs
            </span>
          )}
        </div>

        {a.pricePerMin != null && (
          <p className="mb-3 text-xs text-[var(--jy-text-secondary)]">
            &#8377;{a.pricePerMin}/min
          </p>
        )}
      </Link>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onBook?.(a);
        }}
        className="w-full rounded-lg bg-[var(--jy-accent-gold)]/10 py-2 text-xs font-medium text-[var(--jy-accent-gold)] transition-colors hover:bg-[var(--jy-accent-gold)]/20"
      >
        Book Now
      </button>
    </div>
  );
}

export default AstrologerCard;
