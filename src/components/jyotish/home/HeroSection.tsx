"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Stars } from "lucide-react";
import { CelestialBackground } from "@/components/jyotish/ui/CelestialBackground";
import { useCountUp } from "@/hooks/useCountUp";
import { useIntersection } from "@/hooks/useIntersection";

/**
 * Jyotish home hero.
 *
 * Layout:
 *  - lg+ → two columns. Copy anchored left, a celestial visual on the right.
 *  - md+ → single-column left-aligned copy (still feels editorial).
 *  - mobile → single column, centered for visual balance in a narrow column.
 *
 * Animations — tuned so they feel ambient, not attention-grabbing:
 *  - concentric rings slowly counter-rotate around the Cosmic Path emblem
 *  - stat numbers count up once the block scrolls into view
 *  - star accents twinkle at different phases
 *  - copy rises in on mount
 */
export function HeroSection() {
  return (
    <CelestialBackground className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-24">
        <div className="max-w-xl text-center md:text-left">
          <div
            className="jy-animate-rise-in mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--jy-accent-gold)]/20 bg-[var(--jy-accent-gold)]/5 px-4 py-1.5 text-xs font-medium text-[var(--jy-accent-gold)]"
            style={{ animationDelay: "0ms" }}
          >
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--jy-accent-gold)]" />
            Trusted by 10,000+ seekers
          </div>

          <h1
            className="jy-animate-rise-in mb-5 text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.4rem]"
            style={{ animationDelay: "80ms" }}
          >
            Unlock the Secrets of{" "}
            <span className="bg-gradient-to-r from-[var(--jy-accent-gold)] via-amber-400 to-[var(--jy-accent-purple-light)] bg-clip-text text-transparent">
              Your Stars
            </span>
          </h1>

          <p
            className="jy-animate-rise-in mb-7 text-base leading-relaxed text-[var(--jy-text-secondary)] sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            Personalized Vedic guidance from India&apos;s most experienced
            astrologers. Chat, call, or book a detailed consultation — in
            minutes, from anywhere.
          </p>

          <div
            className="jy-animate-rise-in flex flex-col items-stretch gap-3 sm:flex-row md:items-center md:justify-start"
            style={{ animationDelay: "240ms" }}
          >
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

          <HeroStats />
        </div>

        {/* Right visual — hidden on small screens; a layered zodiac disc on lg+. */}
        <div className="relative hidden lg:block">
          <div className="jy-animate-float relative mx-auto aspect-square w-full max-w-[460px]">
            {/* Outer glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--jy-accent-gold)]/20 via-purple-600/15 to-transparent blur-3xl" />

            {/* Celestial rings — SVG so the dashes + lit arcs rotate
                visibly. CSS dashed borders on rounded divs looked static
                because every dash around the circumference is identical;
                a dash-array plus a shorter lit arc gives each ring an
                anchor the eye can track as it orbits. */}
            <svg
              aria-hidden
              viewBox="0 0 200 200"
              className="absolute inset-0 h-full w-full"
              fill="none"
            >
              {/* Outer ring — slow clockwise */}
              <g className="jy-animate-orbit-slow" style={{ transformOrigin: "100px 100px" }}>
                <circle
                  cx="100"
                  cy="100"
                  r="94"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth="0.6"
                  strokeDasharray="2 4"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="94"
                  stroke="var(--jy-accent-gold)"
                  strokeOpacity="0.55"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeDasharray="60 530"
                />
              </g>

              {/* Middle ring — opposite direction, faster */}
              <g className="jy-animate-orbit-reverse" style={{ transformOrigin: "100px 100px" }}>
                <circle
                  cx="100"
                  cy="100"
                  r="76"
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="0.6"
                  strokeDasharray="1 3"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="76"
                  stroke="var(--jy-accent-purple-light, #c4b5fd)"
                  strokeOpacity="0.55"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  strokeDasharray="40 438"
                />
              </g>

              {/* Inner ring — medium pace, subtle */}
              <g className="jy-animate-orbit-medium" style={{ transformOrigin: "100px 100px" }}>
                <circle
                  cx="100"
                  cy="100"
                  r="58"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth="0.6"
                  strokeDasharray="2 6"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="58"
                  stroke="var(--jy-accent-gold)"
                  strokeOpacity="0.4"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                  strokeDasharray="20 344"
                />
                {/* Comet dot riding the inner ring */}
                <circle cx="158" cy="100" r="1.6" fill="var(--jy-accent-gold)" />
              </g>
            </svg>

            {/* Center emblem — static so copy reads cleanly against moving rings. */}
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

            {/* Orbiting star accents — twinkling at offset phases. */}
            <Stars
              className="jy-animate-twinkle absolute left-6 top-10 h-5 w-5 text-[var(--jy-accent-gold)]/70"
              style={{ animationDelay: "0ms" }}
            />
            <Stars
              className="jy-animate-twinkle absolute right-8 bottom-12 h-4 w-4 text-amber-300/80"
              style={{ animationDelay: "700ms" }}
            />
            <Stars
              className="jy-animate-twinkle absolute right-16 top-20 h-3 w-3 text-white/40"
              style={{ animationDelay: "1400ms" }}
            />
          </div>
        </div>
      </div>
    </CelestialBackground>
  );
}

export default HeroSection;

/**
 * Stat row — animates each number up from 0 once the row scrolls into view.
 */
function HeroStats() {
  const { ref, isInView } = useIntersection<HTMLDivElement>({
    threshold: 0.3,
    triggerOnce: true,
  });

  return (
    <div
      ref={ref}
      className="mt-10 grid grid-cols-3 gap-4 border-t border-white/5 pt-8 text-center md:text-left"
    >
      <StatItem
        end={500}
        decimals={0}
        suffix="+"
        label="Astrologers"
        play={isInView}
      />
      <StatItem
        end={1}
        decimals={0}
        suffix="M+"
        label="Consultations"
        play={isInView}
      />
      <StatItem
        end={4.8}
        decimals={1}
        suffix=""
        label="Avg Rating"
        play={isInView}
      />
    </div>
  );
}

function StatItem({
  end,
  decimals,
  suffix,
  label,
  play,
}: {
  end: number;
  decimals: number;
  suffix: string;
  label: string;
  play: boolean;
}) {
  const value = useCountUp(end, {
    duration: 1600,
    decimals,
    enabled: play,
  });
  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
  return (
    <div>
      <div className="text-2xl font-bold text-[var(--jy-accent-gold)] tabular-nums sm:text-3xl">
        {display}
        {suffix}
      </div>
      <div className="text-xs text-[var(--jy-text-muted)] sm:text-sm">
        {label}
      </div>
    </div>
  );
}
