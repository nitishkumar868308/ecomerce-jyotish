"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Breadcrumbs } from "@/components/store/categories/Breadcrumbs";
import {
  FilterSidebar,
  AlphabetBar,
  DEFAULT_FILTERS,
} from "@/components/store/categories/FilterSidebar";
import type { FilterState } from "@/components/store/categories/FilterSidebar";
import ProductGrid from "@/components/store/product/ProductGrid";
import { Pagination } from "@/components/ui/Pagination";
import { useProductsFast } from "@/services/products";
import { useCategories } from "@/services/categories";
import { useTags } from "@/services/tags";
import { filterByPlatform } from "@/lib/products";
import { useQuickGoStore } from "@/stores/useQuickGoStore";

// QuickGo categories — mirrors the wizard page's filter + grid structure so
// both storefronts behave the same (sidebar filters on desktop, mobile bottom
// sheet, alphabet bar, pagination). ProductCard already flips its URL based
// on the current pathname, so products link into /hecate-quickgo/product/*.

const ITEMS_PER_PAGE = 12;

export default function QuickGoCategoriesPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const initialCat = searchParams.get("cat") || "";

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    categoryId: initialCat ? Number(initialCat) : DEFAULT_FILTERS.categoryId,
  });

  const quickGoCity = useQuickGoStore((s) => s.city);
  const quickGoPincode = useQuickGoStore((s) => s.pincode);

  // Backend scopes categories to `platform=quickgo` + the shopper's
  // city allowlist. Subcategory picker downstream inherits the same
  // filter so an admin assignment mismatch (sub assigned to a city but
  // the parent category isn't) doesn't sneak sub-rows past.
  const { data: categories, isLoading: catsLoading } = useCategories({
    platform: "quickgo",
    city: quickGoCity || undefined,
  });
  const { data: tagsData } = useTags();
  const tags = tagsData ?? [];

  const { data: productsData, isLoading: productsLoading } = useProductsFast({
    page,
    limit: ITEMS_PER_PAGE,
    categoryId: filters.categoryId,
    subcategoryId: filters.subcategoryId,
    tags: filters.tags.length > 0 ? filters.tags.join(",") : undefined,
    minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
    maxPrice: filters.maxPrice < 50000 ? filters.maxPrice : undefined,
    sortBy: filters.sortBy || undefined,
    sortOrder: filters.sortBy ? filters.sortOrder : undefined,
    letter: filters.letter || undefined,
    search: searchQuery || undefined,
    platform: "quickgo",
    city: quickGoCity || undefined,
    pincode: quickGoPincode || undefined,
  });

  const productList = filterByPlatform(productsData?.data?.products, "quickgo");
  const totalProducts = productsData?.data?.total ?? 0;
  const totalPages = productsData?.data?.totalPages ?? 0;

  const handleFilterChange = useCallback((partial: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
    setPage(1);
  }, []);

  const handleLetterChange = useCallback((letter: string) => {
    setFilters((prev) => ({ ...prev, letter }));
    setPage(1);
  }, []);

  const activeCategory = categories?.find((c) => c.id === filters.categoryId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:pr-12">
      <Breadcrumbs
        items={[
          { label: "Categories" },
          ...(activeCategory ? [{ label: activeCategory.name }] : []),
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          {searchQuery
            ? `Search: "${searchQuery}"`
            : activeCategory
              ? activeCategory.name
              : "All Category"}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {searchQuery
            ? "Search results"
            : "Browse QuickGo's full catalogue — same-day delivery where available."}
        </p>
        {totalProducts > 0 && (
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {totalProducts} product{totalProducts !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <FilterSidebar
          categories={categories ?? []}
          tags={tags}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          isLoading={catsLoading}
        />

        <div className="min-w-0 flex-1">
          <ProductGrid
            products={productList}
            loading={productsLoading}
            className="grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3"
          />

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

        <AlphabetBar
          activeLetter={filters.letter}
          onLetterChange={handleLetterChange}
        />
      </div>
    </div>
  );
}
