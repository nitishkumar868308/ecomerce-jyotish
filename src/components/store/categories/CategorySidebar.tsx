"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ChevronRight, LayoutGrid, X, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";
import { resolveAssetUrl } from "@/lib/assetUrl";
import type { Category } from "@/types/category";

interface CategorySidebarProps {
  categories: Category[];
  activeCategoryName?: string;
  activeSubcategoryName?: string;
  isLoading?: boolean;
}

function SidebarSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-lg bg-[var(--bg-secondary)]" />
      ))}
    </div>
  );
}

export function CategorySidebar({
  categories,
  activeCategoryName,
  activeSubcategoryName,
  isLoading,
}: CategorySidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCategories = categories.filter((c) => c.active);
  const isAllActive = !activeCategoryName;

  const sidebarContent = (
    <nav className="space-y-1">
      {/* All Categories Link */}
      <Link
        href={ROUTES.CATEGORIES}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
          isAllActive
            ? "bg-[var(--accent-primary)] text-white shadow-sm"
            : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
        )}
      >
        <LayoutGrid className="h-4 w-4 shrink-0" />
        <span>All Categories</span>
      </Link>

      {/* Category List */}
      {isLoading ? (
        <SidebarSkeleton />
      ) : (
        activeCategories.map((cat) => (
          <CategoryItem
            key={cat.id}
            category={cat}
            isActive={cat.name.toLowerCase() === activeCategoryName?.toLowerCase()}
            activeSubcategoryName={activeSubcategoryName}
            onNavigate={() => setMobileOpen(false)}
          />
        ))
      )}
    </nav>
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
        Categories
      </button>

      {/* Mobile Drawer */}
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
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[300px] overflow-y-auto bg-[var(--bg-card)] shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-primary)] p-4">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Categories
                </h3>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-3">{sidebarContent}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:w-[270px] lg:shrink-0">
        <div className="sticky top-24 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-primary)] px-5 py-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Browse Categories
            </h3>
          </div>
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-3 scrollbar-none">
            {sidebarContent}
          </div>
        </div>
      </aside>
    </>
  );
}

/* ─── Single Category Item ─── */

function CategoryItem({
  category,
  isActive,
  activeSubcategoryName,
  onNavigate,
}: {
  category: Category;
  isActive: boolean;
  activeSubcategoryName?: string;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(isActive);
  const subcategories = category.subcategories?.filter((s) => s.active) ?? [];
  const hasSubcategories = subcategories.length > 0;

  return (
    <div>
      {/* Category Row */}
      <div
        className={cn(
          "flex items-center rounded-xl transition-all",
          isActive && !activeSubcategoryName
            ? "bg-[var(--accent-primary)] text-white shadow-sm"
            : isActive
              ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
              : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
        )}
      >
        <Link
          href={ROUTES.CATEGORY(category.name)}
          onClick={onNavigate}
          className="flex flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium"
        >
          {category.image ? (
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={resolveAssetUrl(category.image)}
                alt={category.name}
                fill
                sizes="28px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-xs font-bold">
              {category.name.charAt(0)}
            </div>
          )}
          <span className="truncate">{category.name}</span>
        </Link>

        {hasSubcategories && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
              isActive
                ? "hover:bg-white/20"
                : "hover:bg-[var(--bg-tertiary)]"
            )}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Subcategories */}
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
                const isSubActive =
                  isActive &&
                  sub.name.toLowerCase() === activeSubcategoryName?.toLowerCase();

                return (
                  <Link
                    key={sub.id}
                    href={ROUTES.SUBCATEGORY(category.name, sub.name)}
                    onClick={onNavigate}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm transition-all",
                      isSubActive
                        ? "bg-[var(--accent-primary)] font-medium text-white shadow-sm"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {sub.name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CategorySidebar;
