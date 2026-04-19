"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { usePrice } from "@/hooks/usePrice";
import type { ProductVariation } from "@/types/product";

interface ProductVariationGridProps {
  variations: ProductVariation[];
  selectedId: string | null;
  onSelect: (variation: ProductVariation) => void;
  cartCountByVariationId?: Record<string, number>;
}

interface ParsedAttributes {
  [key: string]: string;
}

function parseVariationAttributes(variation: ProductVariation): ParsedAttributes {
  if (variation.attributes && typeof variation.attributes === "object") {
    return variation.attributes as ParsedAttributes;
  }
  const name = variation.variationName ?? "";
  if (!name) return {};
  return name.split("/").reduce<ParsedAttributes>((acc, chunk) => {
    const [k, v] = chunk.split(":").map((s) => s.trim());
    if (k && v) acc[k] = v;
    return acc;
  }, {});
}

export function ProductVariationGrid({
  variations,
  selectedId,
  onSelect,
  cartCountByVariationId = {},
}: ProductVariationGridProps) {
  const { format } = usePrice();

  const grouped = useMemo(() => {
    const byKey: Record<string, { label: string; options: Array<{ value: string; variation: ProductVariation }> }> = {};
    for (const v of variations) {
      const attrs = parseVariationAttributes(v);
      const entries = Object.entries(attrs);
      if (entries.length === 0) continue;
      const [primaryKey, primaryValue] = entries[0];
      if (!byKey[primaryKey]) byKey[primaryKey] = { label: primaryKey, options: [] };
      if (!byKey[primaryKey].options.some((o) => o.value === primaryValue)) {
        byKey[primaryKey].options.push({ value: primaryValue, variation: v });
      }
    }
    return byKey;
  }, [variations]);

  if (variations.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(grouped).map(([key, group]) => (
        <div key={key} className="flex flex-col gap-2">
          <div className="text-sm font-medium text-[var(--text-secondary)]">
            {group.label}
          </div>
          <div className="flex flex-wrap gap-2">
            {group.options.map(({ value, variation }) => {
              const stock = parseInt(variation.stock ?? "0", 10);
              const disabled = stock <= 0;
              const selected = selectedId === variation.id;
              const cartCount = cartCountByVariationId[variation.id] ?? 0;
              return (
                <button
                  key={variation.id}
                  type="button"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(variation);
                  }}
                  className={cn(
                    "relative flex min-w-[5rem] flex-col items-start gap-1 rounded-xl border px-3 py-2 text-left transition-colors",
                    selected
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                      : "border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]",
                    disabled && "cursor-not-allowed opacity-40"
                  )}
                >
                  <span className="text-sm font-semibold">{value}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {format(variation.price)}
                  </span>
                  {cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent-primary)] px-1 text-[10px] font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                  {disabled && (
                    <span className="text-[10px] uppercase text-[var(--accent-danger)]">
                      Out of stock
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
