"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdCampaign } from "@/types/jyotish";

interface Props {
  campaigns?: AdCampaign[];
  /** Daily cap the admin has configured for active ad slots. */
  dailyCap?: number;
}

/**
 * Admin-facing calendar that shows how many ad campaigns are active on each
 * day of the month against the daily cap. This replaces "you have to scroll
 * the table to see overlap" with a visual at-a-glance view.
 *
 * Colour legend:
 *   - gray  → no campaigns
 *   - gold  → below cap
 *   - red   → at or above cap (admin needs to intervene)
 */
export function CampaignCalendar({ campaigns = [], dailyCap = 5 }: Props) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const weeks = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const daysInMonth = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0,
    ).getDate();

    // Calendar grid starts on Sunday.
    const leadingBlanks = first.getDay();
    const cells: Array<{ date: Date | null }> = [];
    for (let i = 0; i < leadingBlanks; i++) cells.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), d) });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null });

    const rows: Array<typeof cells> = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [cursor]);

  const countOnDate = (date: Date): number => {
    const d = date.getTime();
    return campaigns.reduce((n, c) => {
      const s = new Date(c.startDate).setHours(0, 0, 0, 0);
      const e = new Date(c.endDate).setHours(23, 59, 59, 999);
      return d >= s && d <= e && c.status !== "ENDED" ? n + 1 : n;
    }, 0);
  };

  const shiftMonth = (delta: number) =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));

  const monthLabel = cursor.toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Ad slot calendar
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Daily cap: {dailyCap} campaign{dailyCap === 1 ? "" : "s"}. Red
            cells exceed the cap.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="min-w-[10ch] text-center text-sm font-semibold">
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {weeks.flat().map((cell, i) => {
          if (!cell.date) {
            return (
              <div
                key={`blank-${i}`}
                className="aspect-square rounded-md bg-transparent"
              />
            );
          }
          const count = countOnDate(cell.date);
          const state =
            count === 0
              ? "empty"
              : count >= dailyCap
                ? "full"
                : "some";
          return (
            <div
              key={cell.date.toISOString()}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-md text-xs ${
                state === "empty"
                  ? "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                  : state === "full"
                    ? "bg-red-500/20 text-red-500"
                    : "bg-[var(--jy-accent-gold)]/15 text-[var(--jy-accent-gold)]"
              }`}
              title={`${count}/${dailyCap} campaigns`}
            >
              <span className="text-sm font-medium">
                {cell.date.getDate()}
              </span>
              {count > 0 && (
                <span className="text-[9px] font-semibold">
                  {count}/{dailyCap}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CampaignCalendar;
