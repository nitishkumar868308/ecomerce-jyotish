"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  IndianRupee,
  AlertTriangle,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  useAdAvailability,
  useBookAd,
  useMyAdBookings,
  useActiveAdCampaigns,
  type AdAvailabilityDay,
  type AdCampaignEntry,
} from "@/services/jyotish/ad-campaign";
import toast from "react-hot-toast";

/**
 * Ad campaigns page (astrologer side).
 *
 *   - Top: selectable tiles sourced from the AdCampaign admin table
 *     (title + price + capacity). Astrologer picks one; the tile's
 *     price becomes the rate for subsequent day-bookings so the
 *     astrologer knows upfront what each day costs on this campaign.
 *   - Middle: month calendar whose days are colour-coded by remaining
 *     capacity across all campaigns (red=full, amber=partial,
 *     green=open). Past days + non-current-month cells are disabled.
 *   - Right rail: price card (pulling from the selected campaign),
 *     live running total, "Pay & book" stub, past bookings list.
 */
export default function AstrologerAdCampaignsPage() {
  const { user } = useAuthStore();
  const astrologerId = user?.id as number | undefined;

  // Month anchor for the calendar grid. Switching months triggers a
  // new availability fetch for the new window.
  const [monthAnchor, setMonthAnchor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Selected AdCampaign entry (admin's template) + selected dates.
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(
    null,
  );
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  const { data: campaigns = [], isLoading: loadingCampaigns } =
    useActiveAdCampaigns();
  const { startStr, endStr, gridDays } = useMemo(
    () => buildMonthGrid(monthAnchor),
    [monthAnchor],
  );
  const { data: avail, isLoading: loadingAvail } = useAdAvailability(
    startStr,
    endStr,
  );
  const { data: myBookings } = useMyAdBookings(astrologerId);
  const book = useBookAd();

  const availabilityMap = useMemo(() => {
    const map = new Map<string, AdAvailabilityDay>();
    for (const d of avail?.availability ?? []) map.set(d.date, d);
    return map;
  }, [avail]);

  const myBookedDays = useMemo(() => {
    const set = new Set<string>();
    for (const b of (myBookings ?? []) as any[]) {
      const s = new Date(b.startDate);
      const e = new Date(b.endDate);
      const cursor = new Date(s);
      while (cursor <= e) {
        set.add(dateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return set;
  }, [myBookings]);

  const selectedCampaign: AdCampaignEntry | null =
    campaigns.find((c) => c.id === selectedCampaignId) ?? null;
  const pricePerSlot = selectedCampaign?.price ?? 0;
  const total = selectedDates.size * pricePerSlot;

  const toggleDay = (dayStr: string, day: AdAvailabilityDay | undefined) => {
    if (!day) return;
    if (day.available <= 0) {
      toast.error("That day is fully booked.");
      return;
    }
    if (!selectedCampaign) {
      toast.error("Pick a campaign first.");
      return;
    }
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dayStr)) next.delete(dayStr);
      else next.add(dayStr);
      return next;
    });
  };

  const handleBook = async () => {
    if (!astrologerId || selectedDates.size === 0 || !selectedCampaign) return;
    try {
      await book.mutateAsync({
        astrologerId,
        dates: [...selectedDates].sort(),
        // Pass the picked campaign so backend bills its `price × days`
        // and the stored AdBooking.amount matches the tile rate the
        // astrologer saw — previously it was silently using the
        // global AdCampaignConfig.pricePerDay, so a ₹400 tile ended
        // up writing ₹1000/day on the booking row.
        campaignId: selectedCampaign.id,
      });
      toast.success(
        `Booked ${selectedDates.size} day(s) on ${selectedCampaign.title}`,
      );
      setSelectedDates(new Set());
    } catch {
      // error toast already fired by useBookAd
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--jy-accent-purple)] to-[var(--jy-accent-gold)] text-white shadow-lg">
          <Megaphone className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-[var(--jy-text-primary)] sm:text-2xl">
            Ad campaigns
          </h1>
          <p className="text-sm text-[var(--jy-text-muted)]">
            Pick an admin-published campaign, then choose the days you want to
            appear as a featured astrologer.
          </p>
        </div>
      </header>

      {/* ── Campaign tiles (admin-defined, price-per-slot) ── */}
      <section className="space-y-3">
        <h2 className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--jy-accent-gold)]">
          <Sparkles className="h-3.5 w-3.5" /> Available campaigns
        </h2>
        {loadingCampaigns ? (
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-6 text-sm text-[var(--jy-text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading campaigns…
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Admin hasn&rsquo;t published any ad campaigns yet. You&rsquo;ll see
            them here as soon as they do — booking opens after that.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => {
              const active = c.id === selectedCampaignId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    // Switching campaigns resets the date selection so
                    // the astrologer doesn't accidentally book the old
                    // campaign's rate against the new one's total.
                    setSelectedCampaignId(c.id);
                    setSelectedDates(new Set());
                  }}
                  className={cn(
                    "group text-left rounded-2xl border p-4 transition-all",
                    active
                      ? "border-[var(--jy-accent-gold)] bg-gradient-to-br from-[var(--jy-accent-gold)]/15 to-amber-500/5 shadow-lg shadow-amber-500/10"
                      : "border-white/10 bg-[var(--jy-bg-card)] hover:border-[var(--jy-accent-gold)]/40 hover:bg-white/[0.03]",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-[var(--jy-text-primary)]">
                      {c.title}
                    </h3>
                    {active && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--jy-accent-gold)]" />
                    )}
                  </div>
                  <p className="mt-2 text-2xl font-bold text-[var(--jy-accent-gold)]">
                    ₹{Number(c.price).toLocaleString("en-IN")}
                    <span className="ml-1 text-xs font-medium text-[var(--jy-text-muted)]">
                      / slot
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--jy-text-muted)]">
                    {c.capacity} astrologer{c.capacity === 1 ? "" : "s"} can join.
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Calendar + summary ── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                <CalendarIcon className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--jy-accent-gold)]">
                {monthAnchor.toLocaleString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setMonthAnchor(
                    new Date(
                      monthAnchor.getFullYear(),
                      monthAnchor.getMonth() - 1,
                      1,
                    ),
                  )
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[var(--jy-text-secondary)] hover:border-[var(--jy-accent-gold)]/40 hover:text-[var(--jy-accent-gold)]"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setMonthAnchor(
                    new Date(
                      monthAnchor.getFullYear(),
                      monthAnchor.getMonth() + 1,
                      1,
                    ),
                  )
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[var(--jy-text-secondary)] hover:border-[var(--jy-accent-gold)]/40 hover:text-[var(--jy-accent-gold)]"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!selectedCampaign && (
            <div className="mb-3 rounded-xl border border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/10 p-3 text-xs text-[var(--jy-accent-gold)]">
              Select a campaign above to enable booking days.
            </div>
          )}

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-widest text-[var(--jy-text-muted)]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {loadingAvail && (
              <div className="col-span-7 flex items-center justify-center py-10 text-sm text-[var(--jy-text-muted)]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking
                availability…
              </div>
            )}
            {!loadingAvail &&
              gridDays.map(({ key, date, isCurrentMonth, isPast }) => {
                const day = availabilityMap.get(key);
                const booked = day?.booked ?? 0;
                const available = day?.available ?? 0;
                const capacity = booked + available;
                const isFull = capacity > 0 && available <= 0;
                const isPartial = booked > 0 && available > 0;
                const disabled =
                  !isCurrentMonth || isPast || isFull || !selectedCampaign;
                const isSelected = selectedDates.has(key);
                const isMine = myBookedDays.has(key);

                const bg = !isCurrentMonth
                  ? "bg-transparent border-white/5 text-[var(--jy-text-faint)]"
                  : isPast
                    ? "bg-white/[0.02] border-white/10 text-[var(--jy-text-faint)] line-through"
                    : isFull
                      ? "bg-red-500/15 border-red-500/40 text-red-200"
                      : isPartial
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-200 hover:bg-amber-500/20"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/20";

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleDay(key, day)}
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-center rounded-xl border p-1 text-center transition-colors disabled:cursor-not-allowed",
                      bg,
                      isSelected &&
                        !disabled &&
                        "ring-2 ring-[var(--jy-accent-gold)] bg-[var(--jy-accent-gold)]/20 border-[var(--jy-accent-gold)] text-[var(--jy-accent-gold)]",
                    )}
                    aria-pressed={isSelected}
                  >
                    <span className="text-sm font-bold leading-none">
                      {date.getDate()}
                    </span>
                    {isCurrentMonth && isFull && !isPast && (
                      <span className="mt-0.5 text-[9px] leading-none opacity-90">
                        Full
                      </span>
                    )}
                    {isMine && (
                      <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--jy-accent-gold)] shadow-[0_0_0_2px_rgba(255,215,0,0.25)]" />
                    )}
                  </button>
                );
              })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-[var(--jy-text-muted)]">
            <LegendDot tone="green" label="Open" />
            <LegendDot tone="amber" label="Partial" />
            <LegendDot tone="red" label="Full" />
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--jy-accent-gold)]" />
              Your booking
            </span>
          </div>
        </section>

        {/* ── Sidebar ── */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--jy-accent-purple)]/20 via-white/[0.02] to-[var(--jy-accent-gold)]/10 p-5">
            <h2 className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--jy-accent-gold)]">
              <IndianRupee className="h-3.5 w-3.5" /> Selected campaign
            </h2>
            {selectedCampaign ? (
              <>
                <p className="text-sm font-semibold text-[var(--jy-text-primary)]">
                  {selectedCampaign.title}
                </p>
                <p className="mt-2 text-3xl font-bold text-[var(--jy-text-primary)]">
                  ₹
                  {Number(selectedCampaign.price).toLocaleString("en-IN")}
                  <span className="ml-1 text-sm font-medium text-[var(--jy-text-muted)]">
                    / slot
                  </span>
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--jy-text-muted)]">
                Pick a campaign above to start.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-5">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--jy-accent-gold)]">
              Your selection
            </h2>
            {selectedDates.size === 0 ? (
              <p className="text-sm text-[var(--jy-text-muted)]">
                Tap open days on the calendar to add them.
              </p>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {[...selectedDates].sort().map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--jy-accent-gold)]/40 bg-[var(--jy-accent-gold)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--jy-accent-gold)]"
                    >
                      {new Date(k).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  ))}
                </div>
                <div className="space-y-1.5 border-t border-white/10 pt-3 text-xs">
                  <Row label="Days selected" value={`${selectedDates.size}`} />
                  <Row
                    label="Rate"
                    value={`₹${pricePerSlot.toLocaleString("en-IN")}/slot`}
                  />
                  <div className="flex items-center justify-between pt-2 text-sm">
                    <span className="font-semibold text-[var(--jy-text-primary)]">
                      Total payable
                    </span>
                    <span className="text-lg font-bold text-[var(--jy-accent-gold)]">
                      ₹{total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </>
            )}

            <button
              type="button"
              disabled={
                selectedDates.size === 0 ||
                !selectedCampaign ||
                book.isPending
              }
              onClick={handleBook}
              className={cn(
                "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors",
                selectedDates.size === 0 || !selectedCampaign
                  ? "bg-white/5 text-[var(--jy-text-muted)] opacity-60 cursor-not-allowed"
                  : "bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 text-[var(--jy-bg-primary)] shadow-lg shadow-amber-500/20 hover:brightness-110",
              )}
            >
              {book.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {book.isPending ? "Booking…" : "Pay & book"}
            </button>
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--jy-text-muted)]">
              Payment gateway (PayU / PayGlocal) wire-up is coming — the
              button currently records the booking directly so the flow is
              testable end-to-end.
            </p>
          </section>

          {myBookings && myBookings.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-5">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--jy-accent-gold)]">
                Your past bookings
              </h2>
              <ul className="space-y-2">
                {(myBookings as any[]).slice(0, 5).map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs"
                  >
                    <span className="text-[var(--jy-text-primary)]">
                      {new Date(b.startDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}{" "}
                      →{" "}
                      {new Date(b.endDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                      <span className="ml-2 text-[var(--jy-text-muted)]">
                        ({b.days}d)
                      </span>
                    </span>
                    <span className="font-semibold text-[var(--jy-accent-gold)]">
                      {b.currencySymbol ?? "₹"}
                      {Number(b.amount ?? 0).toLocaleString("en-IN")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

/* ─────────────── helpers ─────────────── */

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(monthAnchor: Date) {
  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridEnd = new Date(lastOfMonth);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: Array<{
    key: string;
    date: Date;
    isCurrentMonth: boolean;
    isPast: boolean;
  }> = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const d = new Date(cursor);
    days.push({
      key: dateKey(d),
      date: d,
      isCurrentMonth: d.getMonth() === month,
      isPast: d < today,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    startStr: dateKey(gridStart),
    endStr: dateKey(gridEnd),
    gridDays: days,
  };
}

function LegendDot({
  tone,
  label,
}: {
  tone: "green" | "amber" | "red";
  label: string;
}) {
  const cls =
    tone === "green"
      ? "bg-emerald-500/40 border-emerald-500"
      : tone === "amber"
        ? "bg-amber-500/40 border-amber-500"
        : "bg-red-500/40 border-red-500";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full border", cls)} />
      {label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-[var(--jy-text-muted)]">{label}</span>
      <span className="font-semibold text-[var(--jy-text-primary)]">
        {value}
      </span>
    </div>
  );
}
