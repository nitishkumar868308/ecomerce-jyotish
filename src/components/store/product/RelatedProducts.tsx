"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProducts, useProductsFast } from "@/services/products";
import { filterByPlatform, type StorePlatform } from "@/lib/products";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/types/product";

interface RelatedProductsProps {
  categoryId?: number;
  currentProductId: string | number;
  className?: string;
  platform?: StorePlatform;
  /** QuickGo only — shopper's picked fulfillment city. Forwarded to the
   *  backend so the related row is narrowed to locally-stocked products. */
  city?: string;
  /** QuickGo only — shopper's pincode (pairs with `city`). */
  pincode?: string;
}

/**
 * Platform-aware dispatcher. Wizard and QuickGo want different list
 * semantics — wizard pulls the full category across ALL products and
 * filters client-side (consistent with how the wizard storefront has
 * always behaved), while QuickGo must filter on the server by city +
 * pincode so unstocked products never leak into the rail. Both are
 * plugged into the same presentation component so the UI stays 1:1.
 */
export function RelatedProducts(props: RelatedProductsProps) {
  if (props.platform === "quickgo") {
    return <QuickGoRelatedFetcher {...props} />;
  }
  return <WizardRelatedFetcher {...props} />;
}

function WizardRelatedFetcher({
  categoryId,
  currentProductId,
  className,
}: RelatedProductsProps) {
  const { data, isLoading } = useProducts({ categoryId, limit: 12 });
  const products = filterByPlatform(data?.data, "wizard").filter(
    (p) => p.id !== currentProductId,
  );
  return (
    <RelatedProductsView
      products={products}
      isLoading={isLoading}
      className={className}
    />
  );
}

function QuickGoRelatedFetcher({
  categoryId,
  currentProductId,
  className,
  city,
  pincode,
}: RelatedProductsProps) {
  // `enabled` is implicit — if city/pincode aren't ready yet react-query
  // will still issue the request, but the backend short-circuits to an
  // empty result when the location filter doesn't match anything, so
  // the rail stays empty instead of leaking non-QuickGo stock.
  const { data, isLoading } = useProductsFast({
    categoryId,
    page: 1,
    limit: 12,
    platform: "quickgo",
    city: city || undefined,
    pincode: pincode || undefined,
  });
  const products = ((data?.data?.products ?? []) as Product[]).filter(
    (p) => p.id !== currentProductId,
  );
  return (
    <RelatedProductsView
      products={products}
      isLoading={isLoading}
      className={className}
    />
  );
}

function RelatedProductsView({
  products,
  isLoading,
  className,
}: {
  products: Product[];
  isLoading: boolean;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  // No empty-state placeholder — when the locally-stocked list has only
  // the current product (or nothing related), the whole section just
  // disappears so the PDP doesn't show a lonely "Related" header.
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
