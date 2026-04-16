"use client";

import React from "react";
import { PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/types/product";

interface ProductGridProps {
  products?: Product[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
      <Skeleton className="aspect-square w-full rounded-none" height="100%" />
      <div className="space-y-2 p-4">
        <Skeleton height={12} width="40%" />
        <Skeleton height={16} width="80%" />
        <Skeleton height={14} width="60%" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton height={18} width="30%" />
          <Skeleton height={14} width="20%" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-secondary)]">
        <PackageOpen className="h-8 w-8 text-[var(--text-secondary)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Products Found</h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">{message}</p>
    </div>
  );
}

export function ProductGrid({
  products,
  loading = false,
  emptyMessage = "We couldn't find any products matching your criteria. Try adjusting your filters.",
  className,
}: ProductGridProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4",
          className
        )}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default ProductGrid;
