"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountryStore } from "@/stores/useCountryStore";
import { useLocationStates } from "@/services/admin/location";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { ROUTES } from "@/config/routes";

const COUNTRIES = [
  { code: "IND", name: "India", currency: "INR", symbol: "\u20b9", flag: "\ud83c\uddee\ud83c\uddf3", exchangeRate: 1 },
  { code: "USA", name: "United States", currency: "USD", symbol: "$", flag: "\ud83c\uddfa\ud83c\uddf8", exchangeRate: 0.012 },
  { code: "GBR", name: "United Kingdom", currency: "GBP", symbol: "\u00a3", flag: "\ud83c\uddec\ud83c\udde7", exchangeRate: 0.0095 },
  { code: "EUR", name: "Europe", currency: "EUR", symbol: "\u20ac", flag: "\ud83c\uddea\ud83c\uddfa", exchangeRate: 0.011 },
  { code: "AUS", name: "Australia", currency: "AUD", symbol: "A$", flag: "\ud83c\udde6\ud83c\uddfa", exchangeRate: 0.018 },
  { code: "CAN", name: "Canada", currency: "CAD", symbol: "C$", flag: "\ud83c\udde8\ud83c\udde6", exchangeRate: 0.016 },
];

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
    logoSrc: "/image/logohwm.png",
    logoAlt: "Hecate Wizard Mall",
    logoHref: ROUTES.HOME,
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
  const [selectedState, setSelectedState] = useState<string>("");
  const countryRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<HTMLDivElement>(null);

  const { data: locationStates } = useLocationStates();

  const currentCountry = COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];

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

  // Load saved state
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("selectedState") : null;
    if (saved) setSelectedState(saved);
  }, []);

  const handleStateSelect = (stateName: string) => {
    setSelectedState(stateName);
    localStorage.setItem("selectedState", stateName);
    setStateOpen(false);
  };

  const activeStates = locationStates?.filter((s) => s.isActive) ?? [];

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
        {variant !== "quickgo" && (
          <div ref={countryRef} className="relative">
            <button
              type="button"
              onClick={() => setCountryOpen(!countryOpen)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span>{currentCountry.flag}</span>
              <span>{currentCountry.name}</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", countryOpen && "rotate-180")} />
            </button>

            {countryOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] py-1 shadow-[var(--shadow-lg)] animate-in fade-in slide-in-from-top-1 duration-150">
                {COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      setCountry(country);
                      setCountryOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-secondary)]",
                      country.code === code && "bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-medium",
                    )}
                  >
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                    <span className="ml-auto text-[var(--text-muted)]">{country.symbol} {country.currency}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* State selector (for quickgo only) */}
        {variant === "quickgo" && (
          <div ref={stateRef} className="relative">
            <button
              type="button"
              onClick={() => setStateOpen(!stateOpen)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <MapPin className="h-3 w-3" />
              <span>{selectedState || "Select State"}</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", stateOpen && "rotate-180")} />
            </button>

            {stateOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] max-h-[300px] overflow-y-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] py-1 shadow-[var(--shadow-lg)] animate-in fade-in slide-in-from-top-1 duration-150">
                {activeStates.length > 0 ? (
                  activeStates.map((state) => (
                    <button
                      key={state.id}
                      type="button"
                      onClick={() => handleStateSelect(state.name)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-secondary)]",
                        selectedState === state.name && "bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-medium",
                      )}
                    >
                      <MapPin className="h-3 w-3 opacity-50" />
                      <span>{state.name}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-xs text-[var(--text-muted)]">No states available</p>
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
        {/* Show Jyotish logo when on QuickGo, QuickGo logo when on Jyotish */}
        {variant === "quickgo" && (
          <Link href={ROUTES.JYOTISH.HOME} className="text-xs font-medium opacity-70 hover:opacity-100 transition-opacity">
            ✨ Jyotish
          </Link>
        )}
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
