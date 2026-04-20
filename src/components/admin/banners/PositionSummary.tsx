"use client";

import { useMemo, useState } from "react";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Banner } from "@/types/banner";
import type { LocationState } from "@/services/admin/location";

interface PositionSummaryProps {
  banners: Banner[] | undefined;
  locations: LocationState[] | undefined;
  className?: string;
}

// Top-of-page summary showing — across ALL active banners — which positions
// are taken for each country/city, and which positions are missing in the
// sequence. Lets an admin spot gaps without opening each banner.
export function PositionSummary({
  banners,
  locations,
  className,
}: PositionSummaryProps) {
  const [expanded, setExpanded] = useState(true);

  const { countries, cities, totalGaps } = useMemo(() => {
    const cMap = new Map<string, number[]>();
    const sMap = new Map<number, number[]>();

    for (const b of banners ?? []) {
      if (!b.active) continue;
      for (const c of b.countries ?? []) {
        const arr = cMap.get(c.countryCode) ?? [];
        arr.push(c.position);
        cMap.set(c.countryCode, arr);
      }
      for (const s of b.states ?? []) {
        const arr = sMap.get(s.stateId) ?? [];
        arr.push(s.position);
        sMap.set(s.stateId, arr);
      }
    }

    const summarise = <K extends string | number>(
      entries: Array<[K, number[]]>,
      labelFor: (k: K) => string,
    ) =>
      entries
        .map(([key, positions]) => {
          const sorted = [...positions].sort((a, b) => a - b);
          const max = sorted.length ? sorted[sorted.length - 1] : 0;
          const expected = Array.from({ length: max }, (_, i) => i + 1);
          const missing = expected.filter((p) => !sorted.includes(p));
          const duplicates = sorted.filter(
            (p, i) => sorted.indexOf(p) !== i,
          );
          return {
            key,
            label: labelFor(key),
            positions: Array.from(new Set(sorted)),
            missing,
            duplicates: Array.from(new Set(duplicates)),
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));

    const locs = locations ?? [];
    const cityLabel = (id: number) => {
      const loc = locs.find((l) => l.id === id);
      if (!loc) return `Location #${id}`;
      return loc.city ? `${loc.city}, ${loc.name}` : loc.name;
    };

    const countries = summarise(Array.from(cMap.entries()), (code) => code);
    const cities = summarise(Array.from(sMap.entries()), cityLabel);
    const totalGaps =
      countries.reduce((n, r) => n + r.missing.length, 0) +
      cities.reduce((n, r) => n + r.missing.length, 0);

    return { countries, cities, totalGaps };
  }, [banners, locations]);

  if (countries.length === 0 && cities.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((x) => !x)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Position map
          </span>
          {totalGaps > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertTriangle className="h-3 w-3" />
              {totalGaps} missing
            </span>
          ) : (
            <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
              No gaps
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="grid gap-4 border-t border-[var(--border-primary)] p-4 sm:grid-cols-2">
          <SummaryColumn
            title={`Countries (${countries.length})`}
            rows={countries}
            emptyMessage="No country positions yet."
          />
          <SummaryColumn
            title={`Cities (${cities.length})`}
            rows={cities}
            emptyMessage="No city positions yet."
          />
        </div>
      )}
    </div>
  );
}

interface SummaryRow {
  key: string | number;
  label: string;
  positions: number[];
  missing: number[];
  duplicates: number[];
}

function SummaryColumn({
  title,
  rows,
  emptyMessage,
}: {
  title: string;
  rows: SummaryRow[];
  emptyMessage: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={String(r.key)}
              className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-1">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {r.label}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {r.positions.length} position
                  {r.positions.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {r.positions.map((p) => {
                  const isDup = r.duplicates.includes(p);
                  return (
                    <span
                      key={`t-${p}`}
                      className={cn(
                        "rounded-md border px-1.5 py-0.5 text-xs font-medium",
                        isDup
                          ? "border-[var(--accent-danger)] bg-red-50 text-[var(--accent-danger)] dark:bg-red-950/20"
                          : "border-[var(--accent-primary)] bg-[var(--accent-primary-light,rgba(99,102,241,0.1))] text-[var(--accent-primary)]",
                      )}
                    >
                      #{p}
                    </span>
                  );
                })}
                {r.missing.map((p) => (
                  <span
                    key={`m-${p}`}
                    className="rounded-md border border-dashed border-[var(--border-primary)] px-1.5 py-0.5 text-xs text-[var(--text-muted)]"
                    title={`Position ${p} is missing`}
                  >
                    #{p}
                  </span>
                ))}
              </div>
              {(r.missing.length > 0 || r.duplicates.length > 0) && (
                <div className="mt-1 space-y-0.5 text-xs">
                  {r.missing.length > 0 && (
                    <p className="text-amber-700 dark:text-amber-300">
                      Missing: {r.missing.map((p) => `#${p}`).join(", ")}
                    </p>
                  )}
                  {r.duplicates.length > 0 && (
                    <p className="text-[var(--accent-danger)]">
                      Duplicate: {r.duplicates.map((p) => `#${p}`).join(", ")}
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
