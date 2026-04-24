"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  MessageCircle,
  Phone,
  Globe,
  Calendar,
  MapPin,
  Sparkles,
  Clock,
  ShieldCheck,
  Quote,
} from "lucide-react";
import { useAstrologerProfile } from "@/services/jyotish/profile";
import { useConsultationLauncher } from "@/services/jyotish/consultation-launcher";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { cn } from "@/lib/utils";

/**
 * Public astrologer profile. Single-column on phones, two-column on
 * desktop with a sticky booking pane. Hero stack collapses cleanly to
 * a centred mobile layout; bio sits immediately after the hero so it's
 * the first thing shoppers read; services + chips follow. All fields
 * read from the full Prisma shape — `profile.image`, `services`,
 * `profile.languages` etc. — with safe fallbacks.
 */
export default function AstrologerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: astrologer, isLoading } = useAstrologerProfile(id, {
    publicOnly: true,
  });
  const launcher = useConsultationLauncher();

  const derived = useMemo(() => {
    const a = astrologer;
    if (!a) return null;
    const name = a.displayName || a.fullName || a.name || "Astrologer";
    const initials = name
      .split(/\s+/)
      .map((p: string) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const rawImg = a.profile?.image || a.avatar;
    const src = rawImg ? resolveAssetUrl(rawImg) || rawImg : "";
    const services = (a.services ?? []) as Array<{
      id?: number;
      serviceName?: string;
      price?: number | string;
      currencySymbol?: string;
    }>;
    const cheapest = services
      .map((s) => Number(s.price))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((x, y) => x - y)[0];
    const currencySymbol =
      services.find((s) => s.currencySymbol)?.currencySymbol ?? "₹";
    const languages = (a.languages ?? a.profile?.languages ?? []) as string[];
    const specializations = (a.specializations ??
      a.profile?.specializations ??
      []) as string[];
    const experience =
      typeof a.experience === "number"
        ? a.experience
        : typeof a.profile?.experience === "number"
          ? a.profile.experience
          : 0;
    const city = a.profile?.city ?? "";
    const country = a.profile?.country ?? "";
    const bio = (a.bio || a.profile?.bio || "").toString().trim();
    return {
      name,
      initials,
      src,
      services,
      cheapest,
      currencySymbol,
      languages,
      specializations,
      experience,
      city,
      country,
      bio,
      isOnline: !!a.isOnline,
      rating: Number(a.rating ?? a.avgRating ?? 0),
    };
  }, [astrologer]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 rounded-2xl bg-white/5" />
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-3">
              <div className="h-28 rounded-2xl bg-white/5" />
              <div className="h-40 rounded-2xl bg-white/5" />
            </div>
            <div className="h-40 rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!astrologer || !derived) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-lg font-semibold text-[var(--jy-text-primary)]">
          Astrologer not found
        </p>
        <p className="text-sm text-[var(--jy-text-muted)]">
          They may not be available at the moment.
        </p>
        <Link
          href="/jyotish/consult-now"
          className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/10 px-4 py-2 text-xs font-semibold text-[var(--jy-accent-gold)]"
        >
          Browse all astrologers
        </Link>
      </div>
    );
  }

  const {
    name,
    initials,
    src,
    services,
    cheapest,
    currencySymbol,
    languages,
    specializations,
    experience,
    city,
    country,
    bio,
    isOnline,
    rating,
  } = derived;

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/jyotish/consult-now"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-[var(--jy-text-muted)] hover:text-[var(--jy-accent-gold)]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Astrologers
        </Link>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[var(--jy-accent-purple)]/25 via-[#15102a]/60 to-[var(--jy-accent-gold)]/10 p-5 shadow-xl sm:p-7">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[var(--jy-accent-gold)]/25 blur-3xl" />
            <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-[var(--jy-accent-purple)]/30 blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
            {/* Avatar + status. Status pill sits OUTSIDE the avatar box
                (offset below) so it never crops over the photo — the
                earlier `-bottom-1` placement was intersecting the
                image edge on square avatars. On mobile it centers
                under the avatar; on desktop it tucks bottom-right. */}
            <div className="relative shrink-0 pb-5">
              <div className="h-24 w-24 overflow-hidden rounded-2xl border-2 border-[var(--jy-accent-gold)]/40 bg-[var(--jy-accent-purple)]/25 sm:h-28 sm:w-28">
                {src ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={src}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--jy-accent-purple-light)]">
                    {initials}
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "absolute bottom-0 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest shadow-md whitespace-nowrap",
                  isOnline
                    ? "border-emerald-400/50 bg-emerald-500 text-white"
                    : "border-white/15 bg-[#1a1130] text-[var(--jy-text-secondary)]",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isOnline ? "bg-white" : "bg-[var(--jy-text-muted)]",
                  )}
                />
                {isOnline ? "Live" : "Away"}
              </span>
            </div>

            {/* Name + meta */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-bold text-[var(--jy-text-primary)] sm:text-3xl">
                  {name}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--jy-accent-gold)]">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              </div>
              {specializations.length > 0 && (
                <p className="mt-1 text-sm text-[var(--jy-text-secondary)]">
                  {specializations.slice(0, 4).join(" · ")}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-[var(--jy-text-secondary)] sm:justify-start">
                <span className="inline-flex items-center gap-1 text-[var(--jy-accent-gold)]">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {rating > 0 ? `${rating.toFixed(1)} rating` : "New"}
                </span>
                {experience > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {experience} yr{experience === 1 ? "" : "s"}
                  </span>
                )}
                {languages.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    {languages.slice(0, 3).join(", ")}
                  </span>
                )}
                {(city || country) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {[city, country].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mobile CTA bar — sits inside the hero so small screens see
              booking actions above the fold without scrolling past the
              bio. Desktop uses the sticky right rail instead. */}
          <div className="relative mt-5 grid grid-cols-2 gap-2 lg:hidden">
            <button
              type="button"
              disabled={launcher.isPending}
              onClick={() => launcher.launch(astrologer, "chat")}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 px-3 py-2.5 text-xs font-semibold text-[var(--jy-bg-primary)] shadow-md shadow-amber-500/20"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Chat
              {cheapest != null && (
                <span className="opacity-75">
                  · {currencySymbol}
                  {cheapest.toLocaleString("en-IN")}
                </span>
              )}
            </button>
            <button
              type="button"
              disabled={launcher.isPending}
              onClick={() => launcher.launch(astrologer, "call")}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--jy-accent-gold)]/40 bg-[var(--jy-accent-gold)]/10 px-3 py-2.5 text-xs font-semibold text-[var(--jy-accent-gold)]"
            >
              <Phone className="h-3.5 w-3.5" /> Call
            </button>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* ── Main column ── */}
          <div className="min-w-0 space-y-5">
            {/* About */}
            <section className="rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-5 sm:p-6">
              <h2 className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--jy-accent-gold)]">
                <Sparkles className="h-3.5 w-3.5" /> About
              </h2>
              {bio ? (
                <div className="relative rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm leading-relaxed text-[var(--jy-text-secondary)]">
                  <Quote className="absolute -left-1 -top-1 h-4 w-4 text-[var(--jy-accent-gold)]/50" />
                  <p className="whitespace-pre-wrap pl-2">{bio}</p>
                </div>
              ) : (
                <p className="text-sm italic text-[var(--jy-text-faint)]">
                  This astrologer hasn&apos;t added a bio yet.
                </p>
              )}
            </section>

            {/* Services */}
            {services.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-5 sm:p-6">
                <h2 className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--jy-accent-gold)]">
                  <Sparkles className="h-3.5 w-3.5" /> Services &amp; pricing
                </h2>
                <ul className="divide-y divide-white/5">
                  {services.map((s, i) => (
                    <li
                      key={s.id ?? i}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="min-w-0 truncate text-sm text-[var(--jy-text-primary)]">
                        {s.serviceName ?? "Consultation"}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-[var(--jy-accent-gold)]">
                        {s.currencySymbol ?? "₹"}
                        {Number(s.price ?? 0).toLocaleString("en-IN")}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Specializations + languages */}
            {(specializations.length > 0 || languages.length > 0) && (
              <section className="grid gap-4 rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-5 sm:grid-cols-2 sm:p-6">
                {specializations.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--jy-text-muted)]">
                      Specializations
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {specializations.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--jy-accent-gold)]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {languages.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--jy-text-muted)]">
                      Languages
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {languages.map((l) => (
                        <span
                          key={l}
                          className="rounded-full border border-[var(--jy-accent-purple)]/40 bg-[var(--jy-accent-purple)]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--jy-accent-purple-light)]"
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* ── Desktop sticky CTA ── */}
          <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block lg:self-start">
            <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--jy-accent-purple)]/20 via-white/[0.02] to-[var(--jy-accent-gold)]/10 p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--jy-accent-gold)]">
                Starts at
              </p>
              <p className="mt-1 text-3xl font-bold text-[var(--jy-text-primary)]">
                {currencySymbol}
                {cheapest != null ? cheapest.toLocaleString("en-IN") : "—"}
                <span className="ml-1 text-sm font-medium text-[var(--jy-text-muted)]">
                  / session
                </span>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={launcher.isPending}
              onClick={() => launcher.launch(astrologer, "chat")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 px-3 py-2.5 text-xs font-semibold text-[var(--jy-bg-primary)] shadow-md shadow-amber-500/20 hover:brightness-110"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Chat
                </button>
                <button
                  type="button"
                  disabled={launcher.isPending}
              onClick={() => launcher.launch(astrologer, "call")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--jy-accent-gold)]/40 bg-[var(--jy-accent-gold)]/10 px-3 py-2.5 text-xs font-semibold text-[var(--jy-accent-gold)] hover:bg-[var(--jy-accent-gold)]/20"
                >
                  <Phone className="h-3.5 w-3.5" /> Call
                </button>
              </div>
              <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-[var(--jy-text-muted)]">
                <Clock className="h-3 w-3" />
                {isOnline
                  ? "Available now — instant start"
                  : "Offline — book a slot, they'll reach out"}
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-5 text-xs text-[var(--jy-text-secondary)]">
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--jy-text-muted)]">
                How it works
              </h3>
              <ol className="space-y-1.5 pl-4 [&>li]:list-decimal">
                <li>Pick Chat or Call — your wallet funds the timer.</li>
                <li>
                  The astrologer accepts and the session starts live once
                  they&rsquo;re ready.
                </li>
                <li>Per-minute billing; end the session any time.</li>
              </ol>
            </section>
          </aside>
        </div>
      </div>

    </>
  );
}
