"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  MessageCircle,
  Phone,
  Sparkles,
  Loader2,
} from "lucide-react";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { cn } from "@/lib/utils";
import { useConsultationLauncher } from "@/services/jyotish/consultation-launcher";

interface AstrologerCardProps {
  astrologer: any;
}

/**
 * Astrologer card used on /jyotish (home) and /jyotish/consult-now.
 *
 * Whole card is clickable → routes to the astrologer's public profile
 * page. The Chat and Call buttons stop propagation and fire the
 * consultation launcher directly so they don't also navigate. The
 * card's online indicator combines a coloured dot + explicit
 * "Online" / "Offline" label so shoppers immediately see availability
 * (an un-labelled dot was confusing in earlier rounds of feedback).
 */
export function AstrologerCard({ astrologer: a }: AstrologerCardProps) {
  const router = useRouter();
  const launcher = useConsultationLauncher();

  const astrologerId = a.id || a._id;
  const name = a.displayName || a.fullName || a.name || "Astrologer";
  const initials = name
    .split(/\s+/)
    .map((p: string) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const rawImg = a.profile?.image || a.avatar;
  const src = rawImg ? resolveAssetUrl(rawImg) || rawImg : "";

  const services = ((a.services ?? []) as Array<{
    serviceName?: string;
    price?: number | string;
    currencySymbol?: string;
  }>);
  const topServiceNames = services
    .map((s) => s.serviceName)
    .filter(Boolean)
    .slice(0, 3) as string[];
  const tagsRow =
    topServiceNames.length > 0
      ? topServiceNames
      : ((a.specializations ?? []) as string[]).slice(0, 3);

  const cheapest = services
    .map((s) => Number(s.price))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((x, y) => x - y)[0];
  const currencySymbol =
    services.find((s) => s.currencySymbol)?.currencySymbol ?? "₹";

  const experience =
    typeof a.experience === "number"
      ? a.experience
      : typeof a.profile?.experience === "number"
        ? a.profile.experience
        : null;

  const languages = (a.languages ?? a.profile?.languages ?? []) as string[];
  const isOnline = !!a.isOnline;
  const isBusy = !!a.isBusy;
  const rating = Number(a.rating ?? a.avgRating ?? 0);

  // Navigate on any click outside the Chat/Call buttons. Buttons stop
  // propagation themselves. Using an onClick on the wrapper beats
  // nesting everything inside a <Link> — that was breaking the inner
  // <button> semantics on some browsers.
  const goToProfile = () => {
    if (astrologerId != null) router.push(`/jyotish/astrologer/${astrologerId}`);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={goToProfile}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToProfile();
        }
      }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-4 transition-all hover:border-[var(--jy-accent-gold)]/40 hover:shadow-xl hover:shadow-[var(--jy-accent-gold)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--jy-accent-gold)]/40"
    >
      {/* Header: avatar + name + status */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-purple)]/20">
            {src ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={src}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[var(--jy-accent-purple-light)]">
                {initials}
              </div>
            )}
          </div>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--jy-bg-card)]",
              isBusy
                ? "bg-amber-500"
                : isOnline
                  ? "bg-emerald-500"
                  : "bg-gray-500",
            )}
            title={isBusy ? "Busy" : isOnline ? "Online" : "Offline"}
          >
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                isBusy || isOnline ? "bg-white animate-pulse" : "bg-white/70",
              )}
            />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-[var(--jy-text-primary)] group-hover:text-[var(--jy-accent-gold)]">
              {name}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest",
                isBusy
                  ? "bg-amber-500/15 text-amber-300"
                  : isOnline
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-white/5 text-[var(--jy-text-muted)]",
              )}
            >
              {isBusy ? "Busy" : isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--jy-text-muted)]">
            <span className="inline-flex items-center gap-0.5 text-[var(--jy-accent-gold)]">
              <Star className="h-3 w-3 fill-current" />
              {rating > 0 ? rating.toFixed(1) : "New"}
            </span>
            {experience != null && experience > 0 && (
              <span>
                · {experience} yr{experience === 1 ? "" : "s"}
              </span>
            )}
            {languages.length > 0 && (
              <span className="truncate">
                · {languages.slice(0, 2).join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Service tags */}
      {tagsRow.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {tagsRow.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-[var(--jy-text-secondary)]"
            >
              <Sparkles className="h-2.5 w-2.5 text-[var(--jy-accent-gold)]" />
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Pricing strip */}
      {cheapest != null && cheapest > 0 && (
        <p className="mt-3 text-[11px] text-[var(--jy-text-muted)]">
          Starts at{" "}
          <span className="font-semibold text-[var(--jy-text-primary)]">
            {currencySymbol}
            {cheapest.toLocaleString("en-IN")}
          </span>{" "}
          <span className="text-[var(--jy-text-faint)]">/ session</span>
        </p>
      )}

      {/* Actions — direct Chat/Call start (no modal). stopPropagation
          keeps clicks from bubbling up to the card-wide navigate. */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={launcher.isPending}
          onClick={(e) => {
            e.stopPropagation();
            launcher.launch(a, "chat");
          }}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 px-3 py-2 text-xs font-semibold text-[var(--jy-bg-primary)] shadow-md shadow-amber-500/20 hover:brightness-110 disabled:opacity-60"
        >
          {launcher.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <MessageCircle className="h-3.5 w-3.5" />
          )}{" "}
          Chat
        </button>
        <button
          type="button"
          disabled={launcher.isPending}
          onClick={(e) => {
            e.stopPropagation();
            launcher.launch(a, "call");
          }}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--jy-accent-gold)]/40 bg-[var(--jy-accent-gold)]/10 px-3 py-2 text-xs font-semibold text-[var(--jy-accent-gold)] hover:bg-[var(--jy-accent-gold)]/20 disabled:opacity-60"
        >
          <Phone className="h-3.5 w-3.5" /> Call
        </button>
      </div>
    </div>
  );
}

export default AstrologerCard;
