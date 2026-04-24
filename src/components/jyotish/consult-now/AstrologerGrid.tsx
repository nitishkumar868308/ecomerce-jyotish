"use client";

import React, { useMemo, useState } from "react";
import {
  Sparkles,
  Zap,
  Search,
  SlidersHorizontal,
  X,
  Star,
  Check,
} from "lucide-react";
import { useAstrologers } from "@/services/jyotish/profile";
import { useConsultantServices } from "@/services/consultant";
import { AstrologerCard } from "./AstrologerCard";
import { cn } from "@/lib/utils";

/** Common languages we fall back to when no astrologer in the catalogue
 *  has populated their languages list yet. Keeps the filter usable in
 *  early-stage deployments. */
const DEFAULT_LANGUAGES = [
  "Hindi",
  "English",
  "Bengali",
  "Marathi",
  "Gujarati",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Punjabi",
];

/* ── helpers ── */

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
  return Boolean(
    a.isFeatured || a.promoted || a.activeCampaign || a.hasActiveAdCampaign,
  );
}

/** Robust price extractor — astrologer row shapes vary. Returns 0 when
 *  we can't infer a price so the slider doesn't blow up on null. */
function pricePerMinuteOf(a: any): number {
  if (typeof a.pricePerMinute === "number") return a.pricePerMinute;
  if (a.pricePerMinute && Number.isFinite(Number(a.pricePerMinute))) {
    return Number(a.pricePerMinute);
  }
  const firstService = (a.services ?? [])[0];
  if (firstService && Number.isFinite(Number(firstService.price))) {
    return Number(firstService.price);
  }
  return 0;
}

function ratingOf(a: any): number {
  return Number(a.rating ?? a.avgRating ?? 0);
}

type SortKey = "relevance" | "price-asc" | "price-desc" | "rating-desc";

interface FilterState {
  search: string;
  services: string[];
  languages: string[];
  minRating: number;
  priceMin: number;
  priceMax: number;
  /** Years of experience — 0 means "no minimum". */
  minExperience: number;
  sort: SortKey;
}

const EMPTY_FILTERS: FilterState = {
  search: "",
  services: [],
  languages: [],
  minRating: 0,
  priceMin: 0,
  priceMax: 5000,
  minExperience: 0,
  sort: "relevance",
};

/**
 * Consult-now listing:
 *   - Sticky filter rail on desktop (lg+) along the left.
 *   - Fixed "Filters" button on mobile that opens a bottom-sheet.
 *   - Sort chip at the top-right (by price / rating).
 *   - Hero strip, featured row, online-now row, offline row — same
 *     composition as before but sitting under the filter-driven result.
 */
export function AstrologerGrid() {
  const { data: astrologers, isLoading } = useAstrologers();
  // Services filter is sourced from the admin `consultant-services`
  // master table — that's the canonical list (ex. Vedic, Tarot, Vastu).
  // Falling back to service names extracted from astrologer records
  // only if admin hasn't populated the master yet, so filter always
  // has something to show.
  const { data: consultantServices } = useConsultantServices();
  const [seed] = useState(() => Math.floor(Math.random() * 100000));
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { allServices, allLanguages, priceBounds } = useMemo(() => {
    const svc = new Set<string>();
    const langs = new Set<string>();
    let lo = Number.POSITIVE_INFINITY;
    let hi = 0;

    // Prefer admin master services list. Titles are shown in full;
    // filter matches case-insensitive against astrologer specializations.
    for (const s of (consultantServices ?? []) as Array<{
      title?: string;
      name?: string;
      active?: boolean;
    }>) {
      if (s.active === false) continue;
      const label = (s.title ?? s.name ?? "").trim();
      if (label) svc.add(label);
    }

    for (const a of (astrologers ?? []) as any[]) {
      // Only fall back to astrologer-entered specializations when the
      // master list is empty.
      if (svc.size === 0) {
        for (const s of a.specializations ?? []) svc.add(s);
      }
      for (const l of a.languages ?? a.profile?.languages ?? []) langs.add(l);
      const p = pricePerMinuteOf(a);
      if (p > 0) {
        lo = Math.min(lo, p);
        hi = Math.max(hi, p);
      }
    }
    if (!Number.isFinite(lo)) lo = 0;

    // Language list always falls back to a curated default so the
    // filter stays usable even before astrologers have filled their
    // language array.
    const languages =
      langs.size > 0 ? [...langs].sort() : [...DEFAULT_LANGUAGES];

    return {
      allServices: [...svc].sort(),
      allLanguages: languages,
      priceBounds: { min: Math.floor(lo), max: Math.max(500, Math.ceil(hi)) },
    };
  }, [astrologers, consultantServices]);

  const filtered = useMemo(() => {
    let list = (astrologers ?? []) as any[];

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (a: any) =>
          (a.name ?? a.displayName ?? a.fullName ?? "")
            .toLowerCase()
            .includes(q) ||
          (a.specializations ?? []).some((s: string) =>
            s.toLowerCase().includes(q),
          ),
      );
    }
    if (filters.services.length > 0) {
      list = list.filter((a: any) =>
        (a.specializations ?? []).some((s: string) =>
          filters.services.includes(s),
        ),
      );
    }
    if (filters.languages.length > 0) {
      list = list.filter((a: any) =>
        (a.languages ?? []).some((l: string) => filters.languages.includes(l)),
      );
    }
    if (filters.minRating > 0) {
      list = list.filter((a: any) => ratingOf(a) >= filters.minRating);
    }
    if (filters.minExperience > 0) {
      list = list.filter((a: any) => {
        const exp =
          typeof a.experience === "number"
            ? a.experience
            : typeof a.profile?.experience === "number"
              ? a.profile.experience
              : 0;
        return exp >= filters.minExperience;
      });
    }
    // Price window. 0 minimum or 0 price means "include unknown prices"
    // so the catalogue doesn't vanish when admin hasn't set a price yet.
    list = list.filter((a: any) => {
      const p = pricePerMinuteOf(a);
      if (p === 0) return filters.priceMin === 0;
      return p >= filters.priceMin && p <= filters.priceMax;
    });

    if (filters.sort === "price-asc") {
      list = [...list].sort(
        (a, b) => pricePerMinuteOf(a) - pricePerMinuteOf(b),
      );
    } else if (filters.sort === "price-desc") {
      list = [...list].sort(
        (a, b) => pricePerMinuteOf(b) - pricePerMinuteOf(a),
      );
    } else if (filters.sort === "rating-desc") {
      list = [...list].sort((a, b) => ratingOf(b) - ratingOf(a));
    }

    return list;
  }, [astrologers, filters]);

  const { promoted, onlineRest, offline } = useMemo(() => {
    const promoted: any[] = [];
    const onlineRest: any[] = [];
    const offline: any[] = [];
    for (const a of filtered) {
      if (isPromoted(a)) promoted.push(a);
      else if (a.isOnline) onlineRest.push(a);
      else offline.push(a);
    }
    return filters.sort === "relevance"
      ? {
          promoted: shuffle(promoted, seed),
          onlineRest: shuffle(onlineRest, seed + 1),
          offline: shuffle(offline, seed + 2),
        }
      : { promoted, onlineRest, offline };
  }, [filtered, seed, filters.sort]);

  // Used for the active-filter count chip on the mobile Filters button
  // and the Reset CTA.
  const activeCount =
    (filters.search.trim() ? 1 : 0) +
    filters.services.length +
    filters.languages.length +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.minExperience > 0 ? 1 : 0) +
    (filters.priceMin > priceBounds.min ||
    filters.priceMax < priceBounds.max
      ? 1
      : 0) +
    (filters.sort !== "relevance" ? 1 : 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* ── Filter rail (desktop) ── */}
      <aside className="hidden self-start lg:sticky lg:top-24 lg:block">
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          allServices={allServices}
          allLanguages={allLanguages}
          priceBounds={priceBounds}
          onReset={() =>
            setFilters({
              ...EMPTY_FILTERS,
              priceMin: priceBounds.min,
              priceMax: priceBounds.max,
            })
          }
        />
      </aside>

      {/* ── Results ── */}
      <div className="min-w-0">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search + sort row */}
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--jy-text-muted)]" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              placeholder="Search astrologers by name or specialty…"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-faint)] outline-none focus:border-[var(--jy-accent-gold)]/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <SortChip
              current={filters.sort}
              onChange={(s) => setFilters({ ...filters, sort: s })}
            />
            {/* Mobile filters trigger */}
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-[var(--jy-text-primary)] hover:bg-white/10 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--jy-accent-gold)] px-1 text-[10px] font-bold text-[var(--jy-bg-primary)]">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Count summary */}
        <p className="mb-4 text-xs text-[var(--jy-text-muted)]">
          {isLoading
            ? "Loading astrologers…"
            : `${filtered.length} astrologer${filtered.length === 1 ? "" : "s"} match your filters`}
        </p>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-5"
              >
                <div className="mx-auto mb-3 h-16 w-16 rounded-full shimmer" />
                <div className="mx-auto mb-2 h-4 w-24 rounded shimmer" />
                <div className="mx-auto mb-2 h-3 w-32 rounded shimmer" />
                <div className="mx-auto h-8 w-full rounded-lg shimmer" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-10 text-center">
            <p className="text-lg font-semibold text-[var(--jy-text-primary)]">
              No astrologers match
            </p>
            <p className="mt-1 text-sm text-[var(--jy-text-muted)]">
              Try loosening the filters or clearing a few tags.
            </p>
            <button
              type="button"
              onClick={() =>
                setFilters({
                  ...EMPTY_FILTERS,
                  priceMin: priceBounds.min,
                  priceMax: priceBounds.max,
                })
              }
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[var(--jy-accent-gold)]/40 bg-[var(--jy-accent-gold)]/10 px-4 py-2 text-xs font-semibold text-[var(--jy-accent-gold)] hover:bg-[var(--jy-accent-gold)]/15"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            {promoted.length > 0 && (
              <Section
                title="Featured astrologers"
                subtitle="Currently promoted — live and ready to consult"
                icon={<Sparkles className="h-4 w-4" />}
                list={promoted}
                highlight
              />
            )}
            {onlineRest.length > 0 && (
              <Section
                title="Online now"
                subtitle="Available for instant chat or call"
                icon={<Zap className="h-4 w-4 text-emerald-400" />}
                list={onlineRest}
              />
            )}
            {offline.length > 0 && (
              <Section
                title="More astrologers"
                subtitle="Book a slot — they'll reach out when online"
                list={offline}
              />
            )}
          </>
        )}
      </div>

      {/* ── Mobile bottom-sheet filters ── */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[80] flex items-end lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#0f0a24] p-5 shadow-2xl animate-in slide-in-from-bottom-8 duration-200">
            {/* grabber */}
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--jy-accent-gold)]">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="rounded-lg p-1.5 text-[var(--jy-text-muted)] hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              allServices={allServices}
              allLanguages={allLanguages}
              priceBounds={priceBounds}
              onReset={() =>
                setFilters({
                  ...EMPTY_FILTERS,
                  priceMin: priceBounds.min,
                  priceMax: priceBounds.max,
                })
              }
            />
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 py-3 text-sm font-semibold text-[var(--jy-bg-primary)] shadow-lg"
            >
              Show {filtered.length} astrologer
              {filtered.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

/* ─────────────────────────── Filter panel ─────────────────────────── */

function FilterPanel({
  filters,
  setFilters,
  allServices,
  allLanguages,
  priceBounds,
  onReset,
}: {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  allServices: string[];
  allLanguages: string[];
  priceBounds: { min: number; max: number };
  onReset: () => void;
}) {
  const toggleArr = (key: "services" | "languages", value: string) => {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilters({ ...filters, [key]: next });
  };

  return (
    <div className="space-y-5 rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-5">
      <div className="flex items-center justify-between">
        <h3 className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--jy-accent-gold)]">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Refine
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] font-semibold text-[var(--jy-text-muted)] hover:text-[var(--jy-accent-gold)]"
        >
          Reset
        </button>
      </div>

      {/* Price */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--jy-text-muted)]">
          Price per minute
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--jy-text-primary)]">
            ₹{filters.priceMin}
          </span>
          <span className="text-[var(--jy-text-faint)]">—</span>
          <span className="text-[var(--jy-text-primary)]">
            ₹{filters.priceMax}
          </span>
        </div>
        <input
          type="range"
          min={priceBounds.min}
          max={priceBounds.max}
          value={filters.priceMin}
          onChange={(e) =>
            setFilters({
              ...filters,
              priceMin: Math.min(Number(e.target.value), filters.priceMax),
            })
          }
          className="mt-3 w-full accent-[var(--jy-accent-gold)]"
        />
        <input
          type="range"
          min={priceBounds.min}
          max={priceBounds.max}
          value={filters.priceMax}
          onChange={(e) =>
            setFilters({
              ...filters,
              priceMax: Math.max(Number(e.target.value), filters.priceMin),
            })
          }
          className="mt-1 w-full accent-[var(--jy-accent-gold)]"
        />
      </div>

      {/* Rating */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--jy-text-muted)]">
          Minimum rating
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[0, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilters({ ...filters, minRating: r })}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                filters.minRating === r
                  ? "border-[var(--jy-accent-gold)] bg-[var(--jy-accent-gold)]/15 text-[var(--jy-accent-gold)]"
                  : "border-white/10 bg-white/5 text-[var(--jy-text-secondary)] hover:border-white/25",
              )}
            >
              {r === 0 ? (
                "Any"
              ) : (
                <>
                  <Star className="h-3 w-3" /> {r}+
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--jy-text-muted)]">
          Minimum experience
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[0, 1, 3, 5, 10].map((yrs) => (
            <button
              key={yrs}
              type="button"
              onClick={() => setFilters({ ...filters, minExperience: yrs })}
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                filters.minExperience === yrs
                  ? "border-[var(--jy-accent-gold)] bg-[var(--jy-accent-gold)]/15 text-[var(--jy-accent-gold)]"
                  : "border-white/10 bg-white/5 text-[var(--jy-text-secondary)] hover:border-white/25",
              )}
            >
              {yrs === 0 ? "Any" : `${yrs}+ yrs`}
            </button>
          ))}
        </div>
      </div>

      {/* Services — always rendered so the shopper sees the filter
          even when the catalogue is still small. Empty-state copy
          inside explains what to expect. */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--jy-text-muted)]">
          Specialisation
        </p>
        {allServices.length === 0 ? (
          <p className="text-[11px] text-[var(--jy-text-faint)]">
            No specialities published yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {allServices.map((s) => {
              const active = filters.services.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleArr("services", s)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    active
                      ? "border-[var(--jy-accent-gold)] bg-[var(--jy-accent-gold)]/15 text-[var(--jy-accent-gold)]"
                      : "border-white/10 bg-white/5 text-[var(--jy-text-secondary)] hover:border-white/25",
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Languages — also always rendered. Falls back to the default
          list above so the filter stays useful during bootstrap. */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--jy-text-muted)]">
          Language
        </p>
        {allLanguages.length === 0 ? (
          <p className="text-[11px] text-[var(--jy-text-faint)]">
            No language data yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {allLanguages.map((l) => {
              const active = filters.languages.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleArr("languages", l)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    active
                      ? "border-[var(--jy-accent-purple-light)] bg-[var(--jy-accent-purple)]/20 text-[var(--jy-accent-purple-light)]"
                      : "border-white/10 bg-white/5 text-[var(--jy-text-secondary)] hover:border-white/25",
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                  {l}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Sort chip ─────────────────────────── */

function SortChip({
  current,
  onChange,
}: {
  current: SortKey;
  onChange: (s: SortKey) => void;
}) {
  const options: Array<{ key: SortKey; label: string }> = [
    { key: "relevance", label: "Relevance" },
    { key: "price-asc", label: "Price: Low → High" },
    { key: "price-desc", label: "Price: High → Low" },
    { key: "rating-desc", label: "Top Rated" },
  ];
  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value as SortKey)}
      style={{
        appearance: "none",
        WebkitAppearance: "none",
        backgroundImage:
          "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.6rem center",
        backgroundSize: "12px",
        paddingRight: "2rem",
      }}
      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-[var(--jy-text-primary)] outline-none focus:border-[var(--jy-accent-gold)]/50"
    >
      {options.map((o) => (
        <option
          key={o.key}
          value={o.key}
          style={{ background: "#0f0a24", color: "#fff" }}
        >
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ─────────────────────────── Section ─────────────────────────── */

function Section({
  title,
  subtitle,
  icon,
  list,
  highlight,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  list: any[];
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
            ? "grid gap-4 rounded-2xl border border-[var(--jy-accent-gold)]/25 bg-[var(--jy-accent-gold)]/5 p-4 sm:grid-cols-2 md:grid-cols-3"
            : "grid gap-4 sm:grid-cols-2 md:grid-cols-3"
        }
      >
        {list.map((a: any) => (
          /* No onBook — card uses the shared launcher directly. */
          <AstrologerCard key={a._id || a.id} astrologer={a} />
        ))}
      </div>
    </div>
  );
}

export default AstrologerGrid;
