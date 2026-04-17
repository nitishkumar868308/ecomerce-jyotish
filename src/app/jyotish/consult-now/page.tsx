"use client";

import React from "react";
import { AstrologerGrid } from "@/components/jyotish/consult-now/AstrologerGrid";

export default function ConsultNowPage() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">
            Find Your{" "}
            <span className="text-[var(--jy-accent-gold)]">Astrologer</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--jy-text-muted)]">
            Browse verified astrologers and book a consultation
          </p>
        </div>
        <AstrologerGrid />
      </div>
    </section>
  );
}
