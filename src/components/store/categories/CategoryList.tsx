"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useCategories } from "@/services/categories";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { CategoryCard } from "./CategoryCard";

interface CategoryListProps {
  className?: string;
}

function CategorySkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
      <Skeleton className="aspect-[4/3] w-full rounded-none" height="100%" />
    </div>
  );
}

export function CategoryList({ className }: CategoryListProps) {
  const { data: categories, isLoading } = useCategories();

  const activeCategories = categories?.filter((c) => c.active) ?? [];

  if (isLoading) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
          className
        )}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <CategorySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (activeCategories.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[var(--text-secondary)]">No categories available.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {activeCategories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}

export default CategoryList;
