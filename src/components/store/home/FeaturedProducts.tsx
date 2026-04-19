"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useCategories, useSubcategories } from "@/services/categories";
import { useProductsFast } from "@/services/products";
import { filterByPlatform } from "@/lib/products";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { ROUTES } from "@/config/routes";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Product } from "@/types/product";
import type { Category, Subcategory } from "@/types/category";

interface SlideEntry {
  category: Category;
  subcategory: Subcategory;
}

export function FeaturedProducts() {
  const { data: categories, isLoading: catsLoading } = useCategories();
  // Fetch all subcategories (no categoryId = all)
  const { data: allSubcategories, isLoading: subsLoading } = useSubcategories();

  // Build flat slide list: category > subcategory pairs in order
  const slides: SlideEntry[] = useMemo(() => {
    if (!categories || !allSubcategories) return [];
    const result: SlideEntry[] = [];
    for (const cat of categories) {
      const catSubs = allSubcategories.filter(
        (s) => s.categoryId === cat.id && s.active && !s.deleted
      );
      for (const sub of catSubs) {
        result.push({ category: cat, subcategory: sub });
      }
    }
    return result;
  }, [categories, allSubcategories]);

  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const [paused, setPaused] = useState(false);

  // Auto-rotate slides every 6s
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % (slides.length || 1));
    }, 6000);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [slides.length, paused, startTimer]);

  const goTo = (idx: number) => {
    setActiveIndex(idx);
    startTimer();
  };

  const goPrev = () => {
    goTo(activeIndex <= 0 ? slides.length - 1 : activeIndex - 1);
  };

  const goNext = () => {
    goTo((activeIndex + 1) % slides.length);
  };

  if (catsLoading || subsLoading) {
    return (
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Skeleton variant="text" className="w-40 h-6 mb-1" />
          <Skeleton variant="text" className="w-56 h-4 mb-5" />
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton
                  variant="rectangle"
                  className="aspect-[4/5] w-full rounded-lg"
                  height="100%"
                />
                <Skeleton variant="text" lines={1} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) return null;

  const current = slides[activeIndex] || slides[0];

  return (
    <section
      className="py-6 sm:py-8 lg:py-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header with navigation */}
        <div className="mb-4 sm:mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)] lg:text-2xl">
              Featured Products
            </h2>
            <AnimatePresence mode="wait">
              <motion.p
                key={`${current.category.id}-${current.subcategory.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mt-1.5 text-sm sm:text-base text-[var(--text-secondary)] truncate"
              >
                {current.category.name}{" "}
                <span className="text-[var(--text-muted)]">›</span>{" "}
                {current.subcategory.name}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={goPrev}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] transition-all"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] transition-all"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <Link
              href={ROUTES.CATEGORY(
                current.category.name
              )}
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-primary-hover)] ml-2"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1 mb-3 overflow-x-auto scrollbar-hide pb-1">
          {slides.map((slide, idx) => (
            <button
              key={`${slide.category.id}-${slide.subcategory.id}`}
              type="button"
              onClick={() => goTo(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 shrink-0",
                idx === activeIndex
                  ? "w-6 bg-[var(--accent-primary)]"
                  : "w-1.5 bg-[var(--border-primary)] hover:bg-[var(--text-muted)]"
              )}
              aria-label={`${slide.category.name} - ${slide.subcategory.name}`}
            />
          ))}
        </div>

        {/* Products grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current.category.id}-${current.subcategory.id}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
          >
            <SubcategoryProducts
              subcategoryId={current.subcategory.id}
            />
          </motion.div>
        </AnimatePresence>

        {/* Mobile View All */}
        <div className="mt-5 text-center sm:hidden">
          <Link
            href={ROUTES.CATEGORY(
              current.category.name
            )}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-primary)] px-5 py-2 text-sm font-medium text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)] hover:text-white"
          >
            View All Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function SubcategoryProducts({
  subcategoryId,
}: {
  subcategoryId: number;
}) {
  const filters = useMemo(
    () => ({
      limit: 9,
      subcategoryId,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
    }),
    [subcategoryId]
  );

  const { data, isLoading } = useProductsFast(filters as any);

  const products: Product[] = Array.isArray(data?.data?.products)
    ? filterByPlatform(data.data.products as Product[], "wizard").slice(0, 9)
    : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton
              variant="rectangle"
              className="aspect-square w-full rounded-xl"
              height="100%"
            />
            <Skeleton variant="text" lines={2} />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[var(--text-muted)]">
        <p className="text-sm">No products found in this subcategory</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
      {products.map((product, idx) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04, duration: 0.35 }}
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const imageSrc = product.image?.[0];
  const price = Number(product.price) || 0;
  const mrp = Number(product.MRP) || 0;
  const hasDiscount = mrp > 0 && mrp > price;
  const discountPercent = hasDiscount
    ? Math.round(((mrp - price) / mrp) * 100)
    : 0;

  // Collect variation info (sizes/colors/variation names)
  const variationTags = useMemo(() => {
    const tags: string[] = [];
    if (product.size?.length) {
      tags.push(`${product.size.length} sizes`);
    }
    if (product.color?.length) {
      tags.push(`${product.color.length} colors`);
    }
    if (
      product.variations?.length &&
      !product.size?.length &&
      !product.color?.length
    ) {
      tags.push(`${product.variations.length} options`);
    }
    return tags;
  }, [product.size, product.color, product.variations]);

  // Price range from variations
  const priceRange = useMemo(() => {
    if (!product.variations?.length) return null;
    const activeVariations = product.variations.filter((v) => v.active);
    if (activeVariations.length === 0) return null;
    const prices = activeVariations.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return null;
    return { min, max };
  }, [product.variations]);

  return (
    <Link
      href={ROUTES.PRODUCT(product.slug || product.id)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg",
        "border border-[var(--border-primary)] bg-[var(--bg-card)]",
        "transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5"
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-secondary)]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-[var(--text-tertiary)]" />
          </div>
        )}

        {hasDiscount && discountPercent > 0 && (
          <span className="absolute left-1 top-1 rounded-full bg-[var(--accent-danger)] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-white">
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-0.5 p-1.5 sm:p-2">
        <h3 className="line-clamp-1 text-[11px] sm:text-xs font-medium leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-primary)]">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1 flex-wrap">
          <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
            {product.currencySymbol || ""}
            {product.price}
          </span>
          {hasDiscount && (
            <span className="text-[9px] sm:text-[10px] text-[var(--text-tertiary)] line-through">
              {product.currencySymbol || ""}
              {product.MRP}
            </span>
          )}
        </div>
        {priceRange && (
          <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)]">
            {product.currencySymbol || ""}
            {priceRange.min} – {product.currencySymbol || ""}
            {priceRange.max}
          </p>
        )}

        {/* Variation tags */}
        {variationTags.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {variationTags.map((tag) => (
              <span
                key={tag}
                className="inline-block rounded bg-[var(--bg-secondary)] px-1 py-px text-[8px] sm:text-[9px] font-medium text-[var(--text-muted)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export default FeaturedProducts;
