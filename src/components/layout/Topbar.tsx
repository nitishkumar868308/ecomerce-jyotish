"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountryStore } from "@/stores/useCountryStore";
import ThemeToggle from "@/components/ui/ThemeToggle";

const COUNTRIES = [
  { code: "IND", name: "India", currency: "INR", symbol: "\u20b9", flag: "\ud83c\uddee\ud83c\uddf3", exchangeRate: 1 },
  { code: "USA", name: "United States", currency: "USD", symbol: "$", flag: "\ud83c\uddfa\ud83c\uddf8", exchangeRate: 0.012 },
  { code: "GBR", name: "United Kingdom", currency: "GBP", symbol: "\u00a3", flag: "\ud83c\uddec\ud83c\udde7", exchangeRate: 0.0095 },
  { code: "EUR", name: "Europe", currency: "EUR", symbol: "\u20ac", flag: "\ud83c\uddea\ud83c\uddfa", exchangeRate: 0.011 },
  { code: "AUS", name: "Australia", currency: "AUD", symbol: "A$", flag: "\ud83c\udde6\ud83c\uddfa", exchangeRate: 0.018 },
  { code: "CAN", name: "Canada", currency: "CAD", symbol: "C$", flag: "\ud83c\udde8\ud83c\udde6", exchangeRate: 0.016 },
];

export function Topbar({ className }: { className?: string }) {
  const { code, symbol, currency, setCountry } = useCountryStore();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={cn(
        "hidden md:flex items-center justify-between bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] py-1.5 px-4 lg:px-8 text-xs text-[var(--text-secondary)]",
        className,
      )}
    >
      {/* Left: Country selector */}
      <div className="flex items-center gap-4">
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors duration-200 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          >
            <span>{current.flag}</span>
            <span>{current.name}</span>
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </button>

          {open && (
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] py-1 shadow-[var(--shadow-lg)] animate-in fade-in slide-in-from-top-1 duration-150">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    setCountry(country);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors duration-150 hover:bg-[var(--bg-secondary)]",
                    country.code === code && "bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-medium",
                  )}
                >
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                  <span className="ml-auto text-[var(--text-muted)]">
                    {country.symbol} {country.currency}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-[var(--text-muted)]">|</span>
        <span>
          Currency: <span className="font-medium text-[var(--text-primary)]">{symbol} {currency}</span>
        </span>
      </div>

      {/* Right: Theme toggle */}
      <div className="flex items-center gap-3">
        <ThemeToggle className="h-7 w-7" />
      </div>
    </div>
  );
}

export default Topbar;
