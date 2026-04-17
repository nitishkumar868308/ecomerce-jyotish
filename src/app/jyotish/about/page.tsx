"use client";

import React from "react";
import { CelestialBackground } from "@/components/jyotish/ui/CelestialBackground";

const values = [
  {
    title: "Ancient Wisdom",
    description:
      "We bring centuries-old Vedic traditions to the modern world, preserving their authenticity while making them accessible to everyone.",
    icon: "\u2729",
  },
  {
    title: "Verified Astrologers",
    description:
      "Every astrologer on our platform undergoes rigorous verification. We check credentials, experience, and conduct regular quality audits.",
    icon: "\u2714",
  },
  {
    title: "Privacy First",
    description:
      "Your consultations are completely confidential. We use end-to-end encryption and never share your personal data with third parties.",
    icon: "\u26E8",
  },
  {
    title: "Affordable Access",
    description:
      "Quality astrological guidance should not be a luxury. We offer consultations at fair prices with a transparent pricing model.",
    icon: "\u2661",
  },
];

const team = [
  { name: "Dr. Raghav Sharma", role: "Chief Astrologer", exp: "25+ years in Vedic Astrology" },
  { name: "Priya Venkatesh", role: "Head of Operations", exp: "Former tech lead at a major startup" },
  { name: "Acharya Devendra", role: "Numerology Expert", exp: "Published author, 18+ years experience" },
];

export default function JyotishAboutPage() {
  return (
    <>
      {/* Hero */}
      <CelestialBackground className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl">
              About{" "}
              <span className="bg-gradient-to-r from-[var(--jy-accent-gold)] to-[var(--jy-accent-purple-light)] bg-clip-text text-transparent">
                Jyotish
              </span>
            </h1>
            <p className="text-lg text-[var(--jy-text-secondary)]">
              Bridging the ancient science of Jyotish Shastra with modern
              technology to bring you personalized celestial guidance from
              India&apos;s most trusted astrologers.
            </p>
          </div>
        </div>
      </CelestialBackground>

      {/* Mission */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-center text-2xl font-bold sm:text-3xl">
              Our <span className="text-[var(--jy-accent-gold)]">Mission</span>
            </h2>
            <p className="text-center text-[var(--jy-text-secondary)]">
              To democratize access to authentic astrological wisdom by
              connecting seekers with verified, experienced astrologers through a
              seamless digital platform. We believe everyone deserves guidance
              that is rooted in tradition and delivered with integrity.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-white/5 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">
            What We{" "}
            <span className="text-[var(--jy-accent-gold)]">Stand For</span>
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)] p-6"
              >
                <div className="mb-3 text-2xl">{v.icon}</div>
                <h3 className="mb-2 text-lg font-semibold">{v.title}</h3>
                <p className="text-sm text-[var(--jy-text-secondary)]">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="border-t border-white/5 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">
            Our{" "}
            <span className="text-[var(--jy-accent-gold)]">Leadership</span>
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {team.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)] p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--jy-accent-purple)]/20 text-xl font-bold text-[var(--jy-accent-purple-light)]">
                  {t.name[0]}
                </div>
                <h3 className="text-base font-semibold">{t.name}</h3>
                <p className="text-sm text-[var(--jy-accent-gold)]">{t.role}</p>
                <p className="mt-1 text-xs text-[var(--jy-text-muted)]">
                  {t.exp}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
