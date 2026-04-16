"use client";

import React from "react";
import Link from "next/link";

const categories = [
  {
    title: "Vedic Astrology",
    description: "Birth chart analysis, predictions, and planetary remedies",
    icon: "&#9788;",
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/20",
  },
  {
    title: "Numerology",
    description: "Life path, destiny, and name numerology readings",
    icon: "&#x2116;",
    color: "from-purple-500/20 to-indigo-500/20",
    border: "border-purple-500/20",
  },
  {
    title: "Tarot Reading",
    description: "Past, present, and future insights through tarot cards",
    icon: "&#9830;",
    color: "from-pink-500/20 to-rose-500/20",
    border: "border-pink-500/20",
  },
  {
    title: "Vastu Shastra",
    description: "Home and office alignment for prosperity and harmony",
    icon: "&#9962;",
    color: "from-cyan-500/20 to-teal-500/20",
    border: "border-cyan-500/20",
  },
  {
    title: "Palmistry",
    description: "Hand reading for character traits and life insights",
    icon: "&#9758;",
    color: "from-emerald-500/20 to-green-500/20",
    border: "border-emerald-500/20",
  },
  {
    title: "Horoscope Matching",
    description: "Kundali matching for marriage compatibility analysis",
    icon: "&#9829;",
    color: "from-red-500/20 to-pink-500/20",
    border: "border-red-500/20",
  },
];

export function ServiceCategories() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Our{" "}
            <span className="text-[var(--jy-accent-gold)]">Services</span>
          </h2>
          <p className="mt-2 text-sm text-[var(--jy-text-muted)]">
            Explore the ancient sciences for modern-day guidance
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              href={`/jyotish/consult-now?specialization=${encodeURIComponent(cat.title)}`}
              className={`group rounded-xl border ${cat.border} bg-gradient-to-br ${cat.color} p-6 transition-all hover:scale-[1.02] hover:shadow-lg`}
            >
              <div
                className="mb-3 text-3xl"
                dangerouslySetInnerHTML={{ __html: cat.icon }}
              />
              <h3 className="mb-1 text-base font-semibold text-[var(--jy-text-primary)]">
                {cat.title}
              </h3>
              <p className="text-sm text-[var(--jy-text-secondary)]">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServiceCategories;
