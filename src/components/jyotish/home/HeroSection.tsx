"use client";

import React from "react";
import Link from "next/link";
import { CelestialBackground } from "@/components/jyotish/ui/CelestialBackground";

export function HeroSection() {
  return (
    <CelestialBackground className="min-h-[85vh] flex items-center">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Decorative orbiting ring */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--jy-accent-gold)]/20 bg-[var(--jy-accent-gold)]/5 px-4 py-1.5 text-sm text-[var(--jy-accent-gold)]">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--jy-accent-gold)]" />
            Trusted by 10,000+ users
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Unlock the Secrets of{" "}
            <span className="bg-gradient-to-r from-[var(--jy-accent-gold)] via-amber-400 to-[var(--jy-accent-purple-light)] bg-clip-text text-transparent">
              Your Stars
            </span>
          </h1>

          <p className="mb-8 text-lg text-[var(--jy-text-secondary)] sm:text-xl">
            Get personalized astrological guidance from India&apos;s most
            experienced Vedic astrologers. Chat, call, or book a detailed
            consultation today.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/jyotish/consult-now"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 px-8 py-3.5 text-base font-semibold text-[var(--jy-bg-primary)] shadow-lg shadow-amber-500/20 transition-transform hover:scale-105"
            >
              Consult Now
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/jyotish/about"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 text-base font-medium text-[var(--jy-text-secondary)] transition-colors hover:border-white/20 hover:text-white"
            >
              Learn More
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 gap-6 border-t border-white/5 pt-10">
            {[
              { value: "500+", label: "Astrologers" },
              { value: "1M+", label: "Consultations" },
              { value: "4.8", label: "Avg Rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-[var(--jy-accent-gold)] sm:text-3xl">
                  {stat.value}
                </div>
                <div className="text-xs text-[var(--jy-text-muted)] sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CelestialBackground>
  );
}

export default HeroSection;
