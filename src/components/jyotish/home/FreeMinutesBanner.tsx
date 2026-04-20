"use client";

import Link from "next/link";
import { Gift, Clock, Sparkles } from "lucide-react";

/**
 * Free minutes call-out on the jyotish home page.
 *
 * Counts the astrologers who currently have a "free session" offer active
 * (either self-funded by the astrologer or admin-funded) and nudges the
 * visitor into consult-now with a clear promise: a few free minutes to
 * experience the service before paying per-minute.
 */
export function FreeMinutesBanner({
  freeAstrologerCount,
  freeMinutes,
}: {
  freeAstrologerCount?: number;
  freeMinutes?: number;
}) {
  const count = freeAstrologerCount ?? 0;
  const minutes = freeMinutes ?? 5;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--jy-accent-gold)]/30 bg-gradient-to-br from-[var(--jy-bg-card)] via-purple-900/30 to-[var(--jy-bg-card)] p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--jy-accent-gold)]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--jy-accent-gold)]/15 text-[var(--jy-accent-gold)]">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                <Sparkles className="h-3 w-3" /> Limited time
              </span>
              <h3 className="mt-2 text-xl font-bold text-[var(--jy-text-primary)] sm:text-2xl">
                First {minutes} minutes on us
              </h3>
              <p className="mt-1 text-sm text-[var(--jy-text-secondary)]">
                {count > 0
                  ? `${count} astrologer${count === 1 ? "" : "s"} are offering a free intro session today.`
                  : "Try a full reading before committing to a paid consultation."}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--jy-text-muted)]">
                <Clock className="h-3.5 w-3.5" />
                Free minutes unlock automatically when you start the chat.
              </p>
            </div>
          </div>

          <Link
            href="/jyotish/consult-now?free=1"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-stretch rounded-xl bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 px-6 py-3 text-sm font-semibold text-[var(--jy-bg-primary)] shadow-lg shadow-amber-500/25 transition-transform hover:scale-[1.02] md:self-center"
          >
            Claim free minutes →
          </Link>
        </div>
      </div>
    </section>
  );
}

export default FreeMinutesBanner;
