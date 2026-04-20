"use client";

import type { Astrologer } from "@/types/jyotish";

interface Props {
  astrologer: Astrologer;
}

export function StatusBanner({ astrologer }: Props) {
  const status =
    astrologer.status ?? (astrologer.isVerified ? "APPROVED" : "PENDING");

  if (status === "APPROVED") return null;

  if (status === "PENDING") {
    return (
      <div className="mb-4 rounded-2xl border border-[var(--jy-accent-gold)]/40 bg-[var(--jy-accent-gold)]/10 p-4 text-sm">
        <div className="font-semibold text-[var(--jy-text-primary)]">
          Registration under review
        </div>
        <div className="mt-1 text-[var(--jy-text-secondary)]">
          Aapki registration review mein hai. Admin approve karne ke baad hi
          students aapko book kar payenge. Profile complete rakhiye — jaldi hoga.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-[var(--accent-danger)]/40 bg-[var(--accent-danger)]/10 p-4 text-sm">
      <div className="font-semibold text-[var(--jy-text-primary)]">
        Registration rejected
      </div>
      <div className="mt-1 text-[var(--jy-text-secondary)]">
        {astrologer.rejectionReason
          ? `Reason: ${astrologer.rejectionReason}`
          : "Admin ne registration reject kar di hai."}{" "}
        Admin se contact karein.
      </div>
    </div>
  );
}
