"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ProductVariation } from "@/types/product";

interface ProductVariantSelectorProps {
  variations: ProductVariation[];
  selectedId?: number;
  onSelect: (variation: ProductVariation) => void;
  className?: string;
}

export function ProductVariantSelector({
  variations,
  selectedId,
  onSelect,
  className,
}: ProductVariantSelectorProps) {
  // Group by attribute keys e.g., { Size: [{value, variation}], Color: [{value, variation}] }
  const attributeGroups = useMemo(() => {
    const groups: Record<string, { value: string; variation: ProductVariation }[]> = {};

    variations.forEach((v) => {
      Object.entries(v.attributes).forEach(([key, value]) => {
        if (!groups[key]) groups[key] = [];
        // Avoid duplicate values in same group
        if (!groups[key].some((g) => g.value === value)) {
          groups[key].push({ value, variation: v });
        }
      });
    });

    return groups;
  }, [variations]);

  if (!variations.length) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {Object.entries(attributeGroups).map(([attrName, options]) => (
        <div key={attrName}>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {attrName}
          </label>
          <div className="flex flex-wrap gap-2">
            {options.map(({ value, variation }) => {
              const isSelected = selectedId === variation.id;
              const isOutOfStock = variation.stock === 0;

              return (
                <button
                  key={`${attrName}-${value}-${variation.id}`}
                  onClick={() => !isOutOfStock && onSelect(variation)}
                  disabled={isOutOfStock}
                  className={cn(
                    "relative rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200",
                    isSelected
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white shadow-sm"
                      : "border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary-light)]",
                    isOutOfStock &&
                      "cursor-not-allowed border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] opacity-50 hover:border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]"
                  )}
                  aria-label={`${attrName}: ${value}${isOutOfStock ? " (Out of stock)" : ""}`}
                >
                  {value}
                  {isOutOfStock && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="h-px w-full rotate-[-20deg] bg-[var(--text-secondary)]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductVariantSelector;
