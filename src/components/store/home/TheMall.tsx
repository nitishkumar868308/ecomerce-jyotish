"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCategories, useSubcategories } from "@/services/categories";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { ROUTES } from "@/config/routes";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { Store, ChevronRight, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TheMall() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  const activeCategories = categories?.filter((c) => c.active) ?? [];

  // Set first category as active by default
  useEffect(() => {
    if (activeCategories.length > 0 && activeCategoryId === null) {
      setActiveCategoryId(activeCategories[0].id);
    }
  }, [activeCategories, activeCategoryId]);

  const activeCategory = activeCategories.find((c) => c.id === activeCategoryId);

  const { data: subcategories, isLoading: subcategoriesLoading } =
    useSubcategories(activeCategoryId ?? undefined);

  const activeSubcategories = subcategories?.filter((s) => s.active) ?? [];

  // Empty state
  if (!categoriesLoading && activeCategories.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="rounded-full bg-[var(--accent-primary-light)] p-2">
            <Store className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              The Mall
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
              Browse categories &amp; find what you need
            </p>
          </div>
        </div>

        {categoriesLoading ? (
          <TheMallSkeleton />
        ) : (
          <>
            {/* MOBILE: Horizontal scroll categories */}
            <div className="lg:hidden">
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                {activeCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 shrink-0 rounded-xl px-4 py-3 transition-all duration-200 border-2",
                      activeCategoryId === cat.id
                        ? "border-[var(--accent-primary)] bg-[var(--accent-primary-light)]"
                        : "border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-hover)]"
                    )}
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                      {cat.image ? (
                        <Image
                          src={resolveAssetUrl(cat.image)}
                          alt={cat.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[var(--text-faint)]">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium whitespace-nowrap",
                        activeCategoryId === cat.id
                          ? "text-[var(--accent-primary)]"
                          : "text-[var(--text-secondary)]"
                      )}
                    >
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Mobile subcategories grid */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategoryId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4"
                >
                  <SubcategoryGrid
                    subcategories={activeSubcategories}
                    category={activeCategory}
                    isLoading={subcategoriesLoading}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* DESKTOP: Side-by-side layout */}
            <div className="hidden lg:flex gap-6 min-h-[400px]">
              {/* Left: Category list */}
              <div className="w-64 shrink-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden">
                <div className="p-3">
                  {activeCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onMouseEnter={() => setActiveCategoryId(cat.id)}
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 text-left group",
                        activeCategoryId === cat.id
                          ? "bg-[var(--accent-primary-light)] border border-[var(--accent-primary)]/30"
                          : "hover:bg-[var(--bg-tertiary)] border border-transparent"
                      )}
                    >
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                        {cat.image ? (
                          <Image
                            src={resolveAssetUrl(cat.image)}
                            alt={cat.name}
                            fill
                            className="object-cover"
                            sizes="36px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[var(--text-faint)]">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium flex-1 truncate transition-colors",
                          activeCategoryId === cat.id
                            ? "text-[var(--accent-primary)]"
                            : "text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]"
                        )}
                      >
                        {cat.name}
                      </span>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 shrink-0 transition-all",
                          activeCategoryId === cat.id
                            ? "text-[var(--accent-primary)] translate-x-0 opacity-100"
                            : "text-[var(--text-faint)] -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Subcategories grid */}
              <div className="flex-1 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategoryId}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeCategory && (
                      <div className="mb-5 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                          {activeCategory.name}
                        </h3>
                        <Link
                          href={ROUTES.CATEGORY(activeCategory.name)}
                          className="text-sm font-medium text-[var(--accent-primary)] hover:underline"
                        >
                          View All →
                        </Link>
                      </div>
                    )}
                    <SubcategoryGrid
                      subcategories={activeSubcategories}
                      category={activeCategory}
                      isLoading={subcategoriesLoading}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function SubcategoryGrid({
  subcategories,
  category,
  isLoading,
}: {
  subcategories: { id: number; name: string; slug?: string; image?: string }[];
  category?: { slug?: string; id: number; name: string } | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[4/3] rounded-xl" />
            <Skeleton height={14} width="70%" />
          </div>
        ))}
      </div>
    );
  }

  if (subcategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-10 w-10 text-[var(--text-faint)] mb-3" />
        <p className="text-sm text-[var(--text-muted)]">
          No subcategories available
        </p>
      </div>
    );
  }

  const categoryName = category?.name || String(category?.id || "");

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
      {subcategories.map((sub, idx) => (
        <motion.div
          key={sub.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.03 }}
        >
          <Link
            href={ROUTES.SUBCATEGORY(categoryName, sub.name)}
            className="group flex flex-col gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-2 transition-colors hover:border-[var(--accent-primary)]"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[var(--bg-tertiary)]">
              {sub.image ? (
                <Image
                  src={resolveAssetUrl(sub.image)}
                  alt={sub.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--text-faint)]">
                  <Package className="h-8 w-8" />
                </div>
              )}
            </div>
            <h4 className="text-sm font-medium leading-tight text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors">
              {sub.name}
            </h4>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

function TheMallSkeleton() {
  return (
    <>
      {/* Mobile skeleton */}
      <div className="lg:hidden">
        <div className="flex gap-3 overflow-hidden pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0">
              <Skeleton variant="circle" width={48} height={48} />
              <Skeleton width={56} height={12} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton height={14} width="70%" />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop skeleton */}
      <div className="hidden lg:flex gap-6 min-h-[400px]">
        <div className="w-64 shrink-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton variant="circle" width={36} height={36} />
              <Skeleton height={14} width="70%" />
            </div>
          ))}
        </div>
        <div className="flex-1 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6">
          <Skeleton height={20} width="30%" className="mb-5" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/3] rounded-xl" />
                <Skeleton height={14} width="70%" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
