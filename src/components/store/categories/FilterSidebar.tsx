"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { usePriceConverter } from "@/hooks/usePriceConverter";

interface FilterCategory {
  id: number;
  name: string;
}

interface FilterValues {
  categoryIds: number[];
  minPrice?: number;
  maxPrice?: number;
  sortBy: string;
}

interface FilterSidebarProps {
  categories: FilterCategory[];
  priceRange?: { min: number; max: number };
  onFilter: (filters: FilterValues) => void;
  initialFilters?: Partial<FilterValues>;
  className?: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

export function FilterSidebar({
  categories,
  priceRange = { min: 0, max: 50000 },
  onFilter,
  initialFilters,
  className,
}: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    initialFilters?.categoryIds ?? []
  );
  const [minPrice, setMinPrice] = useState<string>(
    initialFilters?.minPrice?.toString() ?? ""
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    initialFilters?.maxPrice?.toString() ?? ""
  );
  const [sortBy, setSortBy] = useState(initialFilters?.sortBy ?? "newest");
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    sort: true,
  });
  const { symbol } = usePriceConverter();

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : [...prev, id]
    );
  };

  const handleApply = () => {
    onFilter({
      categoryIds: selectedCategories,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy,
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    onFilter({ categoryIds: [], sortBy: "newest" });
    setIsOpen(false);
  };

  const activeFilterCount =
    selectedCategories.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (sortBy !== "newest" ? 1 : 0);

  const filterContent = (
    <div className="space-y-5">
      {/* Sort */}
      <div>
        <button
          onClick={() => toggleSection("sort")}
          className="flex w-full items-center justify-between text-sm font-semibold text-[var(--text-primary)]"
        >
          Sort By
          {expandedSections.sort ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.sort && (
          <div className="mt-2 space-y-1">
            {SORT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-[var(--bg-secondary)]"
              >
                <input
                  type="radio"
                  name="sort"
                  value={option.value}
                  checked={sortBy === option.value}
                  onChange={() => setSortBy(option.value)}
                  className="h-4 w-4 accent-[var(--accent-primary)]"
                />
                <span className="text-[var(--text-primary)]">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--border-primary)]" />

      {/* Categories */}
      <div>
        <button
          onClick={() => toggleSection("categories")}
          className="flex w-full items-center justify-between text-sm font-semibold text-[var(--text-primary)]"
        >
          Categories
          {expandedSections.categories ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.categories && (
          <div className="mt-2 max-h-48 space-y-1 overflow-y-auto scrollbar-none">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-[var(--bg-secondary)]"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="h-4 w-4 rounded accent-[var(--accent-primary)]"
                />
                <span className="text-[var(--text-primary)]">{cat.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--border-primary)]" />

      {/* Price Range */}
      <div>
        <button
          onClick={() => toggleSection("price")}
          className="flex w-full items-center justify-between text-sm font-semibold text-[var(--text-primary)]"
        >
          Price Range
          {expandedSections.price ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.price && (
          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">
                {symbol}
              </span>
              <input
                type="number"
                placeholder={String(priceRange.min)}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min={0}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] py-2 pl-7 pr-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)]"
              />
            </div>
            <span className="text-sm text-[var(--text-secondary)]">to</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">
                {symbol}
              </span>
              <input
                type="number"
                placeholder={String(priceRange.max)}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min={0}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] py-2 pl-7 pr-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={handleReset} fullWidth>
          Reset
        </Button>
        <Button size="sm" onClick={handleApply} fullWidth>
          Apply Filters
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          leftIcon={<Filter className="h-4 w-4" />}
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary)] text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[var(--bg-overlay)] lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[300px] overflow-y-auto bg-[var(--bg-card)] p-5 shadow-2xl lg:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Filters
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {filterContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:block lg:sticky lg:top-24 lg:h-fit lg:w-[260px] lg:shrink-0 lg:rounded-xl lg:border lg:border-[var(--border-primary)] lg:bg-[var(--bg-card)] lg:p-5 lg:shadow-sm",
          className
        )}
      >
        <h3 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
          Filters
        </h3>
        {filterContent}
      </aside>
    </>
  );
}

export default FilterSidebar;
