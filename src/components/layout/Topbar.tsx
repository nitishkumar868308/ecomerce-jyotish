"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountryStore } from "@/stores/useCountryStore";
import { useQuickGoStore } from "@/stores/useQuickGoStore";
import { useLocationStates } from "@/services/admin/location";
import { useCountryPricing } from "@/services/admin/shipping";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { ROUTES } from "@/config/routes";

const isoToEmoji = (iso2?: string): string => {
  if (!iso2 || iso2.length !== 2) return "🌍";
  const A = 0x1f1e6;
  const upper = iso2.toUpperCase();
  return String.fromCodePoint(
    A + upper.charCodeAt(0) - 65,
    A + upper.charCodeAt(1) - 65
  );
};

type SiteVariant = "wizard" | "quickgo" | "jyotish";

function getSiteVariant(pathname: string): SiteVariant {
  if (pathname.startsWith("/hecate-quickgo")) return "quickgo";
  if (pathname.startsWith("/jyotish")) return "jyotish";
  return "wizard";
}

const SITE_CONFIG: Record<SiteVariant, { label: string; bg: string; text: string; logoSrc?: string; logoAlt?: string; logoHref: string }> = {
  wizard: {
    label: "Hecate Wizard Mall",
    bg: "bg-[var(--bg-secondary)]",
    text: "text-[var(--text-secondary)]",
    logoHref: ROUTES.HOME,
  },
  quickgo: {
    label: "Hecate QuickGo",
    bg: "bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30",
    text: "text-teal-700 dark:text-teal-300",
    logoHref: ROUTES.QUICKGO.HOME,
  },
  jyotish: {
    label: "Jyotish",
    bg: "bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30",
    text: "text-purple-700 dark:text-purple-300",
    logoSrc: "/image/logohwm.png",
    logoAlt: "Hecate Wizard Mall",
    logoHref: ROUTES.HOME,
  },
};

export function Topbar({ className }: { className?: string }) {
  const pathname = usePathname();
  const variant = getSiteVariant(pathname);
  const config = SITE_CONFIG[variant];

  const { code, symbol, currency, setCountry } = useCountryStore();
  const [countryOpen, setCountryOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const countryRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<HTMLDivElement>(null);

  const { data: locationStates } = useLocationStates();
  const quickGoCity = useQuickGoStore((s) => s.city);
  const quickGoPincode = useQuickGoStore((s) => s.pincode);
  const openQuickGoModal = useQuickGoStore((s) => s.openModal);

  const { data: countryPricingRows = [], isLoading: isCountryPricingLoading } = useCountryPricing();
  const countries = countryPricingRows
    .filter((row) => row.active)
    .map((row) => ({
      code: row.code,
      country: row.country,
      currency: row.currency,
      symbol: row.currencySymbol,
      conversionRate: row.conversionRate ?? 1,
      multiplier: row.multiplier ?? 1,
      emoji: isoToEmoji(row.code?.slice(0, 2)),
    }));

  const currentCountry = countries.find((c) => c.code === code) ?? countries[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
      }
      if (stateRef.current && !stateRef.current.contains(e.target as Node)) {
        setStateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Unique cities sourced from the Location master (every row with a city).
  // Sorted alphabetically so the dropdown is predictable even with many rows.
  const allCities = useMemo(() => {
    const byKey = new Map<string, { city: string; state: string }>();
    for (const loc of locationStates ?? []) {
      if (!loc.city) continue;
      const key = loc.city.trim().toLowerCase();
      if (!byKey.has(key)) {
        byKey.set(key, { city: loc.city, state: loc.name });
      }
    }
    return Array.from(byKey.values()).sort((a, b) =>
      a.city.localeCompare(b.city),
    );
  }, [locationStates]);

  const filteredCities = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    if (!q) return allCities;
    return allCities.filter(
      (c) =>
        c.city.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q),
    );
  }, [allCities, citySearch]);

  const handleCityPick = (cityName: string) => {
    setStateOpen(false);
    setCitySearch("");
    // Topbar only preselects the city — the modal drives the pincode step
    // and persists both to the QuickGo store on confirm.
    openQuickGoModal(cityName);
  };

  const cityLabel = quickGoCity
    ? quickGoPincode
      ? `${quickGoCity} · ${quickGoPincode}`
      : quickGoCity
    : "Select City";

  return (
    <div
      className={cn(
        "hidden md:flex items-center justify-between border-b border-[var(--border-primary)] py-1.5 px-4 lg:px-8 text-xs",
        config.bg,
        config.text,
        className,
      )}
    >
      {/* Left: Country/State selector + cross-site logo */}
      <div className="flex items-center gap-4">
        {/* Show cross-site logo for quickgo and jyotish */}
        {config.logoSrc && (
          <Link href={config.logoHref} className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
            <Image src={config.logoSrc} alt={config.logoAlt || ""} width={80} height={28} className="h-5 w-auto object-contain" />
          </Link>
        )}

        {/* Country selector (for wizard and jyotish) */}
        {variant !== "quickgo" && !isCountryPricingLoading && countries.length > 0 && (
          <div ref={countryRef} className="relative">
            <button
              type="button"
              onClick={() => setCountryOpen(!countryOpen)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span>{currentCountry?.emoji}</span>
              <span>{currentCountry?.country}</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", countryOpen && "rotate-180")} />
            </button>

            {countryOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] py-1 shadow-[var(--shadow-lg)] animate-in fade-in slide-in-from-top-1 duration-150">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      setCountry({
                        code: country.code,
                        name: country.country,
                        currency: country.currency,
                        symbol: country.symbol,
                        conversionRate: country.conversionRate,
                        multiplier: country.multiplier,
                      });
                      setCountryOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-secondary)]",
                      country.code === code && "bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-medium",
                    )}
                  >
                    <span>{country.emoji}</span>
                    <span>{country.country}</span>
                    <span className="ml-auto text-[var(--text-muted)]">{country.symbol} {country.currency}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* City selector (for quickgo only) — sourced from the Location master,
            synced with the QuickGo store, clicking a city opens the landing
            modal with that city preselected so the shopper picks a pincode. */}
        {variant === "quickgo" && (
          <div ref={stateRef} className="relative">
            <button
              type="button"
              onClick={() => setStateOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <MapPin className="h-3 w-3" />
              <span className="max-w-[220px] truncate">{cityLabel}</span>
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform duration-200",
                  stateOpen && "rotate-180",
                )}
              />
            </button>

            {stateOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 flex min-w-[240px] max-w-[320px] flex-col overflow-hidden rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-[var(--shadow-lg)] animate-in fade-in slide-in-from-top-1 duration-150">
                {allCities.length > 8 && (
                  <div className="border-b border-[var(--border-primary)] px-2 py-1.5">
                    <input
                      type="text"
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      placeholder="Search city..."
                      className="w-full rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-1 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                      autoFocus
                    />
                  </div>
                )}

                <div className="max-h-[280px] overflow-y-auto py-1">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((c) => {
                      const isActive =
                        quickGoCity?.toLowerCase() === c.city.toLowerCase();
                      return (
                        <button
                          key={`${c.city}__${c.state}`}
                          type="button"
                          onClick={() => handleCityPick(c.city)}
                          className={cn(
                            "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-secondary)]",
                            isActive &&
                              "bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-medium",
                          )}
                        >
                          <MapPin className="h-3 w-3 opacity-50" />
                          <span className="flex-1 truncate">{c.city}</span>
                          <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                            {c.state}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <p className="px-3 py-2 text-xs text-[var(--text-muted)]">
                      {citySearch
                        ? `No cities match "${citySearch}"`
                        : "No cities available"}
                    </p>
                  )}
                </div>

                {quickGoCity && (
                  <div className="border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-1.5 text-[10px] text-[var(--text-muted)]">
                    Current: {quickGoCity}
                    {quickGoPincode && ` · ${quickGoPincode}`}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {variant !== "quickgo" && (
          <>
            <span className="text-[var(--text-muted)]">|</span>
            <span>
              Currency: <span className="font-medium">{symbol} {currency}</span>
            </span>
          </>
        )}
      </div>

      {/* Center: Site name */}
      <div className="absolute left-1/2 -translate-x-1/2 font-semibold tracking-wide text-xs">
        {config.label}
      </div>

      {/* Right: Theme toggle */}
      <div className="flex items-center gap-3">
        {/* Cross-site quick link (none on quickgo) */}
        {variant === "jyotish" && (
          <Link href={ROUTES.QUICKGO.HOME} className="text-xs font-medium opacity-70 hover:opacity-100 transition-opacity">
            QuickGo
          </Link>
        )}
        <ThemeToggle className="h-7 w-7" />
      </div>
    </div>
  );
}

export default Topbar;
