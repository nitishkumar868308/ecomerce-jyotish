"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProducts } from "@/services/products";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { ProductCard } from "./ProductCard";

interface RelatedProductsProps {
  categoryId: number;
  currentProductId: number;
  className?: string;
}

export function RelatedProducts({
  categoryId,
  currentProductId,
  className,
}: RelatedProductsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useProducts({
    categoryId,
    limit: 12,
  });

  const products = data?.data?.filter((p) => p.id !== currentProductId) ?? [];

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (!isLoading && products.length === 0) return null;

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          Related Products
        </h2>
        <div className="hidden gap-2 sm:flex">
          <button
            onClick={() => scroll("left")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-primary)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-primary)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 snap-x snap-mandatory"
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-[200px] shrink-0 snap-start sm:w-[240px] lg:w-[260px]"
              >
                <div className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
                  <Skeleton className="aspect-square w-full rounded-none" height="100%" />
                  <div className="space-y-2 p-3">
                    <Skeleton height={14} width="70%" />
                    <Skeleton height={12} width="50%" />
                    <Skeleton height={16} width="40%" />
                  </div>
                </div>
              </div>
            ))
          : products.map((product) => (
              <div
                key={product.id}
                className="w-[200px] shrink-0 snap-start sm:w-[240px] lg:w-[260px]"
              >
                <ProductCard product={product} />
              </div>
            ))}
      </div>
    </section>
  );
}

export default RelatedProducts;
