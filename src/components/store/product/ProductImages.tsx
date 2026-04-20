"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveAssetUrl } from "@/lib/assetUrl";

interface ProductImagesProps {
  images: string[];
  productName?: string;
  className?: string;
}

export function ProductImages({
  images,
  productName = "Product",
  className,
}: ProductImagesProps) {
  const displayImages = useMemo(() => {
    const normalised = (images ?? [])
      .map((src) => resolveAssetUrl(src))
      .filter(Boolean) as string[];
    return normalised.length > 0 ? normalised : ["/placeholder.png"];
  }, [images]);

  const [activeIndex, setActiveIndex] = useState(0);

  // Reset index when images change
  useEffect(() => {
    setActiveIndex(0);
  }, [displayImages]);

  // Clamp index
  const safeIndex = activeIndex < displayImages.length ? activeIndex : 0;
  const currentSrc = displayImages[safeIndex];

  const goToPrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setActiveIndex((prev) =>
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };

  if (!currentSrc) return null;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Main Image */}
      <div className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <Zoom>
          <img
            src={currentSrc}
            alt={`${productName} - Image ${safeIndex + 1}`}
            className="h-full w-full object-cover"
          />
        </Zoom>

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--bg-card)]/80 text-[var(--text-primary)] opacity-0 shadow-md backdrop-blur-sm transition-opacity duration-200 hover:bg-[var(--bg-card)] group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--bg-card)]/80 text-[var(--text-primary)] opacity-0 shadow-md backdrop-blur-sm transition-opacity duration-200 hover:bg-[var(--bg-card)] group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-2 right-2 z-10 rounded-full bg-[var(--bg-card)]/80 px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] backdrop-blur-sm">
            {safeIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {displayImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 sm:h-20 sm:w-20",
                index === safeIndex
                  ? "border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30"
                  : "border-[var(--border-primary)] opacity-60 hover:opacity-100"
              )}
              aria-label={`View image ${index + 1}`}
            >
              <img
                src={img}
                alt={`${productName} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductImages;
