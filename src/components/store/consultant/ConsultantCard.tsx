"use client";

import React from "react";
import Image from "next/image";
import { Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { usePrice } from "@/hooks/usePrice";

interface ConsultantCardProps {
  astrologer: {
    id: number;
    name: string;
    avatar?: string;
    specializations?: string[];
    rating?: number;
    reviewCount?: number;
    pricePerMinute?: number;
    experience?: number;
    isOnline?: boolean;
  };
  onBook?: (id: number) => void;
  className?: string;
}

export function ConsultantCard({
  astrologer,
  onBook,
  className,
}: ConsultantCardProps) {
  const { format } = usePrice();
  const rating = astrologer.rating ?? 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[var(--bg-secondary)] sm:h-20 sm:w-20">
          {astrologer.avatar ? (
            <Image
              src={astrologer.avatar}
              alt={astrologer.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xl font-bold text-[var(--text-secondary)]">
              {astrologer.name.charAt(0)}
            </div>
          )}
          {/* Online indicator */}
          {astrologer.isOnline && (
            <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[var(--bg-card)] bg-[var(--accent-success)]" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-[var(--text-primary)] sm:text-lg">
            {astrologer.name}
          </h3>

          {/* Rating */}
          <div className="mt-1 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5",
                    i < Math.round(rating)
                      ? "fill-[var(--accent-warning)] text-[var(--accent-warning)]"
                      : "text-[var(--border-primary)]"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-[var(--text-secondary)]">
              {rating.toFixed(1)}
              {astrologer.reviewCount != null && ` (${astrologer.reviewCount})`}
            </span>
          </div>

          {/* Experience */}
          {astrologer.experience != null && (
            <div className="mt-1 flex items-center gap-1 text-xs text-[var(--text-secondary)]">
              <Clock className="h-3 w-3" />
              <span>{astrologer.experience} yrs experience</span>
            </div>
          )}
        </div>
      </div>

      {/* Specializations */}
      {astrologer.specializations && astrologer.specializations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {astrologer.specializations.slice(0, 4).map((spec) => (
            <Badge key={spec} variant="default" className="text-xs">
              {spec}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        {astrologer.pricePerMinute != null && (
          <p className="text-sm font-bold text-[var(--accent-primary)]">
            {format(astrologer.pricePerMinute)}/min
          </p>
        )}
        <Button
          size="sm"
          onClick={() => onBook?.(astrologer.id)}
        >
          Book Now
        </Button>
      </div>
    </div>
  );
}

export default ConsultantCard;
