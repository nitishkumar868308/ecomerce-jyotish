"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  X,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/category";
import type { Tag } from "@/types/product";

export interface FilterState {
  categoryId?: number;
  subcategoryId?: number;
  tags: string[];
  minPrice: number;
  maxPrice: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  letter: string;
}

export const DEFAULT_FILTERS: FilterState = {
  categoryId: undefined,
  subcategoryId: undefined,
  tags: [],
  minPrice: 0,
  maxPrice: 50000,
  sortBy: "",
  sortOrder: "desc",
  letter: "",
};

interface FilterSidebarProps {
  categories: Category[];
  tags: Tag[];
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
  isLoading?: boolean;
  maxPriceLimit?: number;
}

const SORT_OPTIONS = [
  { label: "Price: Low to High", sortBy: "price", sortOrder: "asc" as const },
  { label: "Price: High to Low", sortBy: "price", sortOrder: "desc" as const },
  { label: "Newest First", sortBy: "createdAt", sortOrder: "desc" as const },
  { label: "Name: A to Z", sortBy: "name", sortOrder: "asc" as const },
  { label: "Name: Z to A", sortBy: "name", sortOrder: "desc" as const },
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function SidebarSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded-lg bg-[var(--bg-secondary)]" />
      ))}
    </div>
  );
}

export function FilterSidebar({
  categories,
  tags,
  filters,
  onFilterChange,
  onReset,
  isLoading,
  maxPriceLimit = 50000,
}: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    tags: true,
    price: true,
    sort: true,
  });

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeCategories = categories.filter((c) => c.active);
  const isAllActive = !filters.categoryId;

  const hasActiveFilters =
    filters.tags.length > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice < maxPriceLimit ||
    filters.sortBy !== "" ||
    filters.letter !== "" ||
    !!filters.categoryId;

  const filterContent = (
    <div className="space-y-5">
      {/* Categories Section */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("categories")}
          className="mb-2 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
        >
          Categories
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expandedSections.categories && "rotate-180")} />
        </button>
        {expandedSections.categories && (
          <nav className="space-y-0.5">
            <button
              onClick={() => {
                onFilterChange({ categoryId: undefined, subcategoryId: undefined });
                setMobileOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all",
                isAllActive
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              )}
            >
              <LayoutGrid className="h-4 w-4 shrink-0" />
              All
            </button>

            {isLoading ? (
              <SidebarSkeleton />
            ) : (
              activeCategories.map((cat) => (
                <CategoryFilterItem
                  key={cat.id}
                  category={cat}
                  isActive={cat.id === filters.categoryId}
                  filters={filters}
                  onFilterChange={onFilterChange}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))
            )}
          </nav>
        )}
      </div>

      {/* Tags Section */}
      {tags.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => toggleSection("tags")}
            className="mb-2 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
          >
            Tags
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expandedSections.tags && "rotate-180")} />
          </button>
          {expandedSections.tags && (
            <div className="space-y-0.5">
              <button
                onClick={() => onFilterChange({ tags: [] })}
                className={cn(
                  "block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
                  filters.tags.length === 0
                    ? "bg-[var(--accent-primary)] text-white font-medium"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                )}
              >
                All
              </button>
              {tags.map((tag) => {
                const isSelected = filters.tags.includes(tag.name);
                return (
                  <button
                    key={tag.id}
                    onClick={() => {
                      const newTags = isSelected
                        ? filters.tags.filter((t) => t !== tag.name)
                        : [...filters.tags, tag.name];
                      onFilterChange({ tags: newTags });
                    }}
                    className={cn(
                      "block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-[var(--accent-primary)] text-white font-medium"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                    )}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Price Range */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="mb-2 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
        >
          Price: ₹{filters.minPrice.toLocaleString()} - ₹{filters.maxPrice.toLocaleString()}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expandedSections.price && "rotate-180")} />
        </button>
        {expandedSections.price && (
          <div className="px-1 space-y-3">
            <input
              type="range"
              min={0}
              max={maxPriceLimit}
              value={filters.maxPrice}
              onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) })}
              className="w-full accent-[var(--accent-primary)] cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={filters.maxPrice}
                value={filters.minPrice || ""}
                onChange={(e) => onFilterChange({ minPrice: Number(e.target.value) || 0 })}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                placeholder="Min"
              />
              <span className="text-xs text-[var(--text-muted)]">-</span>
              <input
                type="number"
                min={filters.minPrice}
                max={maxPriceLimit}
                value={filters.maxPrice}
                onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) || maxPriceLimit })}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                placeholder="Max"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sort By */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("sort")}
          className="mb-2 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
        >
          Sort By
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expandedSections.sort && "rotate-180")} />
        </button>
        {expandedSections.sort && (
          <select
            value={filters.sortBy ? `${filters.sortBy}_${filters.sortOrder}` : ""}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                onFilterChange({ sortBy: "", sortOrder: "desc" });
              } else {
                const opt = SORT_OPTIONS.find((o) => `${o.sortBy}_${o.sortOrder}` === val);
                if (opt) onFilterChange({ sortBy: opt.sortBy, sortOrder: opt.sortOrder });
              }
            }}
            className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
          >
            <option value="">Default</option>
            {SORT_OPTIONS.map((opt) => (
              <option key={`${opt.sortBy}_${opt.sortOrder}`} value={`${opt.sortBy}_${opt.sortOrder}`}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Alphabet Filter (inside mobile only) */}
      <div className="lg:hidden">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Filter by Letter
        </h4>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => onFilterChange({ letter: "" })}
            className={cn(
              "flex h-8 min-w-[32px] items-center justify-center rounded text-xs font-medium transition-colors",
              !filters.letter
                ? "bg-[var(--accent-primary)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
            )}
          >
            All
          </button>
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() => onFilterChange({ letter: filters.letter === letter ? "" : letter })}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded text-xs font-medium transition-colors",
                filters.letter === letter
                  ? "bg-[var(--accent-primary)] text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              )}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Filters */}
      {hasActiveFilters && (
        <button
          onClick={() => {
            onReset();
            setMobileOpen(false);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-primary)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] shadow-sm transition-colors hover:bg-[var(--bg-secondary)] lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {hasActiveFilters && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[10px] font-bold text-white">
            !
          </span>
        )}
      </button>

      {/* Mobile Bottom Sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[var(--bg-card)] shadow-2xl lg:hidden"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-2">
                <div className="h-1 w-10 rounded-full bg-[var(--border-primary)]" />
              </div>
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-3">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Filters
                </h3>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">{filterContent}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:w-[270px] lg:shrink-0">
        <div className="sticky top-24 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-primary)] px-5 py-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Filters
            </h3>
          </div>
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4 scrollbar-none">
            {filterContent}
          </div>
        </div>
      </aside>
    </>
  );
}

/* ─── Category Filter Item ─── */

function CategoryFilterItem({
  category,
  isActive,
  filters,
  onFilterChange,
  onNavigate,
}: {
  category: Category;
  isActive: boolean;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(isActive);
  const subcategories = category.subcategories?.filter((s) => s.active) ?? [];
  const hasSubcategories = subcategories.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center rounded-lg transition-all",
          isActive && !filters.subcategoryId
            ? "bg-[var(--accent-primary)] text-white shadow-sm"
            : isActive
              ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
              : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
        )}
      >
        <button
          onClick={() => {
            onFilterChange({ categoryId: category.id, subcategoryId: undefined });
            onNavigate();
          }}
          className="flex flex-1 items-center gap-2.5 px-3 py-2 text-sm font-medium"
        >
          {category.image ? (
            <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md">
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="24px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--bg-secondary)] text-[10px] font-bold">
              {category.name.charAt(0)}
            </div>
          )}
          <span className="truncate">{category.name}</span>
        </button>

        {hasSubcategories && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
              isActive ? "hover:bg-white/20" : "hover:bg-[var(--bg-tertiary)]"
            )}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      <AnimatePresence>
        {expanded && hasSubcategories && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-5 space-y-0.5 border-l-2 border-[var(--border-primary)] py-1 pl-3">
              {subcategories.map((sub) => {
                const isSubActive = isActive && sub.id === filters.subcategoryId;
                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      onFilterChange({
                        categoryId: category.id,
                        subcategoryId: sub.id,
                      });
                      onNavigate();
                    }}
                    className={cn(
                      "block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-all",
                      isSubActive
                        ? "bg-[var(--accent-primary)] font-medium text-white shadow-sm"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Desktop Alphabet Bar (right side) ─── */

export function AlphabetBar({
  activeLetter,
  onLetterChange,
}: {
  activeLetter: string;
  onLetterChange: (letter: string) => void;
}) {
  return (
    <div className="hidden lg:flex sticky top-24 h-fit flex-col items-center gap-0.5 shrink-0 ml-2">
      {ALPHABET.map((letter) => (
        <button
          key={letter}
          onClick={() => onLetterChange(activeLetter === letter ? "" : letter)}
          className={cn(
            "flex h-[22px] w-[22px] items-center justify-center rounded-sm text-[10px] font-semibold transition-all",
            activeLetter === letter
              ? "bg-[var(--accent-primary)] text-white scale-125"
              : "text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-secondary)]"
          )}
          title={letter}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}

export default FilterSidebar;
