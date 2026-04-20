"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Stars } from "lucide-react";
import { CelestialBackground } from "@/components/jyotish/ui/CelestialBackground";

/**
 * Jyotish home hero.
 *
 * Layout:
 *  - lg+ → two columns. Copy anchored left, a celestial visual on the right.
 *  - md+ → single-column left-aligned copy (still feels editorial).
 *  - mobile → single column, centered for visual balance in a narrow column.
 */
export function HeroSection() {
  return (
    <CelestialBackground className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-24">
        <div className="max-w-xl text-center md:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--jy-accent-gold)]/20 bg-[var(--jy-accent-gold)]/5 px-4 py-1.5 text-xs font-medium text-[var(--jy-accent-gold)]">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--jy-accent-gold)]" />
            Trusted by 10,000+ seekers
          </div>

          <h1 className="mb-5 text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.4rem]">
            Unlock the Secrets of{" "}
            <span className="bg-gradient-to-r from-[var(--jy-accent-gold)] via-amber-400 to-[var(--jy-accent-purple-light)] bg-clip-text text-transparent">
              Your Stars
            </span>
          </h1>

          <p className="mb-7 text-base leading-relaxed text-[var(--jy-text-secondary)] sm:text-lg">
            Personalized Vedic guidance from India&apos;s most experienced
            astrologers. Chat, call, or book a detailed consultation — in
            minutes, from anywhere.
          </p>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row md:items-center md:justify-start">
            <Link
              href="/jyotish/consult-now"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 px-7 py-3.5 text-base font-semibold text-[var(--jy-bg-primary)] shadow-lg shadow-amber-500/25 transition-transform hover:scale-[1.02]"
            >
              Consult Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/jyotish/about"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-7 py-3.5 text-base font-medium text-[var(--jy-text-secondary)] transition-colors hover:border-white/20 hover:text-white"
            >
              Learn More
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/5 pt-8 text-center md:text-left">
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

        {/* Right visual — hidden on small screens; a layered zodiac disc on lg+. */}
        <div className="relative hidden lg:block">
          <div className="relative mx-auto aspect-square w-full max-w-[460px]">
            {/* Outer glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--jy-accent-gold)]/20 via-purple-600/15 to-transparent blur-3xl" />

            {/* Celestial rings */}
            <div className="absolute inset-6 rounded-full border border-white/10" />
            <div className="absolute inset-14 rounded-full border border-[var(--jy-accent-gold)]/20" />
            <div className="absolute inset-24 rounded-full border border-white/5" />

            {/* Center emblem */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border border-[var(--jy-accent-gold)]/30 bg-black/40 backdrop-blur-sm">
                <Sparkles className="h-8 w-8 text-[var(--jy-accent-gold)]" />
                <p className="mt-2 text-center text-xs font-semibold uppercase tracking-[0.25em] text-[var(--jy-accent-gold)]">
                  Your
                  <br />
                  Cosmic Path
                </p>
              </div>
            </div>

            {/* Orbiting star accents */}
            <Stars className="absolute left-6 top-10 h-5 w-5 text-[var(--jy-accent-gold)]/70 animate-pulse" />
            <Stars className="absolute right-8 bottom-12 h-4 w-4 text-amber-300/80 animate-pulse" />
            <Stars className="absolute right-16 top-20 h-3 w-3 text-white/40" />
          </div>
        </div>
      </div>
    </CelestialBackground>
  );
}

export default HeroSection;
