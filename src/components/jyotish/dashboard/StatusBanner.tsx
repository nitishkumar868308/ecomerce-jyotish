"use client";

/**
 * Renders the status banner at the top of the astrologer dashboard.
 * The source of truth for status is the Prisma row's booleans —
 * `isApproved / isActive / isRejected` — which is what the backend
 * actually writes. The legacy `status` / `isVerified` fields from the
 * old TS type don't exist on the wire, so reading them returned
 * undefined → the banner always displayed "under review" even for
 * approved + active astrologers.
 *
 * Priority order (most severe wins):
 *   REJECTED → red banner with admin's reason.
 *   APPROVED but inactive → amber banner explaining the pause.
 *   PENDING review → gold banner.
 *   APPROVED + active → no banner (null).
 */
interface Props {
  astrologer: Record<string, any>;
}

export function StatusBanner({ astrologer }: Props) {
  const isRejected = !!astrologer?.isRejected;
  const isApproved = !!astrologer?.isApproved;
  const isActive = !!astrologer?.isActive;

  if (isRejected) {
    const reason =
      astrologer?.rejectReason ??
      astrologer?.rejectionReason ??
      null;
    return (
      <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
        <div className="font-semibold text-[var(--jy-text-primary)]">
          Registration rejected
        </div>
        <div className="mt-1 text-[var(--jy-text-secondary)]">
          {reason ? `Reason: ${reason}` : "Admin ne registration reject kar di hai."}{" "}
          Admin se contact karein.
        </div>
      </div>
    );
  }

  if (isApproved && !isActive) {
    return (
      <div className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
        <div className="font-semibold text-[var(--jy-text-primary)]">
          Account paused
        </div>
        <div className="mt-1 text-[var(--jy-text-secondary)]">
          Aapka account approved hai but abhi inactive hai — students abhi book nahi
          kar payenge. Chat with admin se contact kariye.
        </div>
      </div>
    );
  }

  if (isApproved && isActive) return null;

  return (
    <div className="mb-4 rounded-2xl border border-[var(--jy-accent-gold)]/40 bg-[var(--jy-accent-gold)]/10 p-4 text-sm">
      <div className="font-semibold text-[var(--jy-text-primary)]">
        Registration under review
      </div>
      <div className="mt-1 text-[var(--jy-text-secondary)]">
        Aapki registration review mein hai. Admin approve karne ke baad hi
        User aapko book kar payenge. Profile complete rakhiye — jaldi hoga.
      </div>
    </div>
  );
}
