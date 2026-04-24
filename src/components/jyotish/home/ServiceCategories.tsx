"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useIntersection } from "@/hooks/useIntersection";
import { useConsultantServices } from "@/services/consultant";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { Sparkles } from "lucide-react";

interface ServiceRow {
  id: number;
  title: string;
  shortDesc?: string;
  longDesc?: string;
  image?: string | null;
  active?: boolean;
}

// Presentation accents cycle so each card gets a distinct tint even when
// admin doesn't upload an icon. Consistent order (same id → same tint).
const ACCENTS: Array<{ color: string; border: string }> = [
  { color: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/20" },
  { color: "from-purple-500/20 to-indigo-500/20", border: "border-purple-500/20" },
  { color: "from-pink-500/20 to-rose-500/20", border: "border-pink-500/20" },
  { color: "from-cyan-500/20 to-teal-500/20", border: "border-cyan-500/20" },
  { color: "from-emerald-500/20 to-green-500/20", border: "border-emerald-500/20" },
  { color: "from-red-500/20 to-pink-500/20", border: "border-red-500/20" },
];

export function ServiceCategories() {
  const { ref, isInView } = useIntersection<HTMLDivElement>({
    threshold: 0.15,
    triggerOnce: true,
  });
  const { data, isLoading } = useConsultantServices();

  // Surface only active services; admin-created rows come back in creation
  // order — the storefront shows newest first so freshly-added services
  // get visibility above the fold.
  const services: ServiceRow[] = React.useMemo(() => {
    const list = (Array.isArray(data) ? data : []) as ServiceRow[];
    return list
      .filter((s) => s.active !== false)
      .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }, [data]);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Our <span className="text-[var(--jy-accent-gold)]">Services</span>
          </h2>
          <p className="mt-2 text-sm text-[var(--jy-text-muted)]">
            Explore the ancient sciences for modern-day guidance
          </p>
        </div>

        <div ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && services.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[140px] animate-pulse rounded-xl border border-[var(--jy-border)] bg-[var(--jy-bg-secondary)]/40"
                />
              ))
            : services.length === 0
              ? (
                <p className="col-span-full text-center text-sm text-[var(--jy-text-muted)]">
                  No services live right now \u2014 please check back soon.
                </p>
              )
              : services.map((svc, i) => {
                  const accent = ACCENTS[i % ACCENTS.length];
                  const img = svc.image
                    ? resolveAssetUrl(svc.image) || svc.image
                    : "";
                  return (
                    <Link
                      key={svc.id}
                      href={`/jyotish/consult-now?specialization=${encodeURIComponent(svc.title)}`}
                      className={`group rounded-xl border ${accent.border} bg-gradient-to-br ${accent.color} p-6 transition-all hover:scale-[1.02] hover:shadow-lg ${
                        isInView ? "jy-animate-rise-in" : "opacity-0"
                      }`}
                      style={
                        isInView ? { animationDelay: `${i * 70}ms` } : undefined
                      }
                    >
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--jy-bg-primary)]/60">
                        {img ? (
                          <Image
                            src={img}
                            alt={svc.title}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-md object-cover"
                            unoptimized
                          />
                        ) : (
                          <Sparkles className="h-6 w-6 text-[var(--jy-accent-gold)]" />
                        )}
                      </div>
                      <h3 className="mb-1 text-base font-semibold text-[var(--jy-text-primary)]">
                        {svc.title}
                      </h3>
                      {svc.shortDesc && (
                        <p className="text-sm text-[var(--jy-text-secondary)] line-clamp-2">
                          {svc.shortDesc}
                        </p>
                      )}
                    </Link>
                  );
                })}
        </div>
      </div>
    </section>
  );
}

export default ServiceCategories;
