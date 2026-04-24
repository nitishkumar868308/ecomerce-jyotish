"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Globe, ArrowLeft, MapPin } from "lucide-react";
import { useCountryStore } from "@/stores/useCountryStore";
import { ROUTES } from "@/config/routes";

/**
 * QuickGo is an India-only fulfillment surface — pricing is INR, inventory
 * sits in domestic warehouses, and the pincode/stock model doesn't support
 * cross-border orders. When the storefront country is set to anything other
 * than India (or an unauthenticated visitor lands here directly with a
 * non-India selection persisted), we swap the page body for a friendly
 * "not available in your country" splash instead of rendering the child
 * routes that would otherwise fetch QuickGo listings in a broken state.
 */
export function QuickGoCountryGate({ children }: { children: React.ReactNode }) {
  const code = useCountryStore((s) => s.code);
  const countryName = useCountryStore((s) => s.name);
  const setCountry = useCountryStore((s) => s.setCountry);

  // Persist default is "IND"; treat missing / malformed values as India too
  // so the gate fails open for the most common case.
  const isIndia = (code ?? "IND").toUpperCase() === "IND";
  if (isIndia) return <>{children}</>;

  const switchToIndia = () =>
    setCountry({
      code: "IND",
      name: "India",
      currency: "INR",
      symbol: "₹",
      conversionRate: 1,
      multiplier: 1,
    });

  return (
    <div className="relative min-h-[75vh] overflow-hidden bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-teal-950/40 dark:via-[var(--bg-primary)] dark:to-emerald-950/30">
      {/* Decorative bokeh — tiny dots so the splash doesn't feel empty
          while staying lightweight (no images to load). */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-[10%] top-[15%] h-40 w-40 rounded-full bg-teal-300/30 blur-3xl dark:bg-teal-500/20" />
        <div className="absolute right-[12%] top-[40%] h-56 w-56 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-500/20" />
        <div className="absolute bottom-[8%] left-[30%] h-48 w-48 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/15" />
      </div>

      <div className="relative mx-auto flex min-h-[75vh] max-w-3xl items-center px-4 py-12 sm:py-16">
        <div className="w-full rounded-3xl border border-teal-200/60 bg-white/80 p-6 shadow-xl shadow-teal-500/5 backdrop-blur sm:p-10 dark:border-teal-500/20 dark:bg-[var(--bg-card)]/90">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative h-20 w-52 sm:h-24 sm:w-64">
              <Image
                src="/image/hecate quickgo logo transpreant new.png"
                alt="Hecate QuickGo"
                fill
                sizes="256px"
                className="object-contain"
                priority
              />
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/30 sm:h-20 sm:w-20">
              <Globe className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                QuickGo isn&apos;t available in your country yet
              </h1>
              <p className="mx-auto max-w-xl text-sm text-[var(--text-secondary)] sm:text-base">
                QuickGo delivers in minutes from local warehouses in India.
                Your storefront is set to{" "}
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800 dark:bg-teal-500/15 dark:text-teal-300">
                  <MapPin className="h-3 w-3" />
                  {countryName || code || "outside India"}
                </span>
                , so we can&apos;t fulfil QuickGo orders here right now.
              </p>
            </div>

            <div className="flex w-full flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:justify-center">
              <button
                type="button"
                onClick={switchToIndia}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-teal-500/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <MapPin className="h-4 w-4" />
                Switch storefront to India
              </button>
              <Link
                href={ROUTES.HOME}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Wizard Mall
              </Link>
            </div>

            <p className="max-w-md text-xs text-[var(--text-muted)]">
              Shopping from outside India? Head to Hecate Wizard Mall —
              prices convert to your local currency and we ship
              internationally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickGoCountryGate;
