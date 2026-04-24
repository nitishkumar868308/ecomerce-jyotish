"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Users, Globe, Sparkles, Star } from "lucide-react";

// QuickGo's About page — same brand story as the wizard site, but re-skinned
// against QuickGo's teal palette. Layout (Topbar/Header/Footer/MobileNav) is
// provided by /hecate-quickgo/layout so we only render the page body here.

const FOUNDERS = [
  {
    name: "Pratiek A Jain",
    title: "Founder & Managing Director",
    image: "/image/Pratiek A jain.jpg",
    bio: "Pratiek A Jain is a visionary leader and a powerhouse of mystical wisdom. As the Founder & Managing Director, he bridges the material world with the profound energies of the spiritual realm. A gifted psychic and expert practitioner, his journey reflects years of deep study and spiritual discipline.",
    skills: [
      "Tarot & Numerology",
      "Vastu Shastra",
      "Reiki & Lama Fera Guru",
      "Mystical Work & Spell Casting",
    ],
    impact:
      "Impacted over 10 lakh+ lives across India and abroad. Ensures that 10% of profits support children, hospitals, old age homes, and animal shelters.",
    quote:
      "My mission is to empower individuals to unlock their true potential through the mystical sciences.",
  },
  {
    name: "Kakullie A Jain",
    title: "Co-Founder & CEO",
    image: "/image/koyal.jpeg",
    bio: "Kakullie A Jain is a name synonymous with spiritual enlightenment, profound intuition, and selfless service. As the Co-Founder of Hecate Wizard Mall, she bridges ancient mystical wisdom with modern-day challenges, helping individuals find clarity, purpose, and peace.",
    skills: [
      "Tarot Reading",
      "Vedic & KP Astrology",
      "Vastu & Feng Shui",
      "Numerology",
    ],
    impact:
      "Guided over 10 lakh+ individuals worldwide. Donates 10% of all profits to children's welfare, old age homes, medical aid, and animal shelters.",
    quote:
      "Spirituality is not about seeing the future; it is about empowering people to create a better one.",
  },
];

const STATS = [
  { icon: Users, value: "10 Lakh+", label: "Lives Impacted" },
  { icon: Globe, value: "50+", label: "Countries Served" },
  { icon: Heart, value: "10%", label: "Profits Donated" },
  { icon: Star, value: "15+", label: "Years of Expertise" },
];

export default function QuickGoAboutPage() {
  return (
    <>
      {/* Hero — teal-tinted gradient to match QuickGo's accent palette. */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-emerald-800 to-cyan-900 py-20 sm:py-24 lg:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-emerald-300/15 blur-2xl" />
          <div className="absolute top-1/4 right-1/4 h-1 w-1 rounded-full bg-teal-200/60" />
          <div className="absolute top-1/3 left-1/3 h-1.5 w-1.5 rounded-full bg-emerald-200/50" />
          <div className="absolute bottom-1/4 right-1/3 h-1 w-1 rounded-full bg-cyan-200/40" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 text-sm font-medium text-emerald-100 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Our Story
            </div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              About Hecate QuickGo
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-white/80">
              Fast, local, and trusted — QuickGo is our 1-day delivery home for
              everyday essentials, built on the same values that power Hecate
              Wizard Mall: honest products, reliable service, and care for the
              communities we serve.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 text-center shadow-sm"
            >
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary-light)]">
                <stat.icon className="h-5 w-5 text-[var(--accent-primary)]" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {stat.value}
              </p>
              <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Founders */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
            Meet Our Founders
          </h2>
          <p className="mt-3 text-[var(--text-secondary)]">
            Visionary leaders bringing speed, trust and care to every delivery.
          </p>
        </div>

        <div className="space-y-20 lg:space-y-24">
          {FOUNDERS.map((founder, idx) => {
            const isReversed = idx % 2 === 1;
            return (
              <motion.div
                key={founder.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col items-center gap-8 lg:gap-14 ${
                  isReversed ? "lg:flex-row-reverse" : "lg:flex-row"
                }`}
              >
                <div className="w-full max-w-sm shrink-0 lg:w-2/5">
                  <div className="relative">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 shadow-xl dark:from-teal-950/40 dark:to-emerald-950/40">
                      <Image
                        src={founder.image}
                        alt={founder.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 40vw"
                      />
                    </div>
                    <div className="absolute -inset-3 -z-10 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 blur-sm" />
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                    {founder.name}
                  </h3>
                  <p className="mt-1 text-lg font-medium text-[var(--accent-primary)]">
                    {founder.title}
                  </p>
                  <p className="mt-4 leading-relaxed text-[var(--text-secondary)]">
                    {founder.bio}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {founder.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-primary-light)] px-3.5 py-1.5 text-sm font-medium text-[var(--accent-primary)]"
                      >
                        <Sparkles className="h-3 w-3" />
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
                    <div className="flex items-start gap-3">
                      <Heart className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-danger)]" />
                      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                        {founder.impact}
                      </p>
                    </div>
                  </div>

                  <blockquote className="mt-6 border-l-4 border-[var(--accent-primary)] pl-4 italic text-[var(--text-secondary)]">
                    &ldquo;{founder.quote}&rdquo;
                  </blockquote>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
}
