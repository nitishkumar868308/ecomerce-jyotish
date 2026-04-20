"use client";

import { usePrice } from "@/hooks/usePrice";
import type { Product, ProductVariation } from "@/types/product";

interface ProductDetailsTableProps {
  product: Product;
  selectedVariation?: ProductVariation | null;
}

interface Row {
  label: string;
  value: string;
}

type DimBag = Record<string, unknown> | null | undefined;

/** Pick the first non-empty value for any of the provided keys on a bag. */
function pickDim(bag: DimBag, keys: string[]): string | number | undefined {
  if (!bag) return undefined;
  for (const k of keys) {
    const v = (bag as Record<string, unknown>)[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return v as string | number;
    }
  }
  return undefined;
}

/** Format dimension value with unit (default cm). Falls back to "-" for missing. */
function dimStr(value: string | number | undefined, unit = "cm"): string {
  if (value === undefined || value === null || String(value).trim() === "") return "-";
  const num = Number(value);
  return Number.isFinite(num) ? `${num} ${unit}` : String(value);
}

export function ProductDetailsTable({
  product,
  selectedVariation,
}: ProductDetailsTableProps) {
  const { format } = usePrice();

  // Variation dimension/weight take precedence; fall back to product-level.
  const variationDim = (selectedVariation?.dimension ?? null) as DimBag;
  const productDim = (product.dimension ?? null) as DimBag;

  const length =
    pickDim(variationDim, ["length", "l", "len"]) ??
    pickDim(productDim, ["length", "l", "len"]) ??
    (product as any).length;
  const breadth =
    pickDim(variationDim, ["breadth", "width", "b", "w"]) ??
    pickDim(productDim, ["breadth", "width", "b", "w"]) ??
    ((product as any).breadth ?? (product as any).width);
  const height =
    pickDim(variationDim, ["height", "h"]) ??
    pickDim(productDim, ["height", "h"]) ??
    (product as any).height;
  const variationWeight =
    pickDim(variationDim, ["weight", "wt"]) ??
    (selectedVariation as { weight?: number } | null | undefined)?.weight;
  const weight = variationWeight ?? product.weight;

  const activeSku = selectedVariation?.sku || product.sku;
  const activePrice = selectedVariation?.price ?? product.price;

  const rows: Row[] = [];
  if (product.name) rows.push({ label: "Name", value: product.name });
  if (activePrice) rows.push({ label: "Price", value: format(activePrice) });
  if (activeSku) rows.push({ label: "SKU", value: String(activeSku) });

  if (length || breadth || height) {
    rows.push({
      label: "Dimensions (L × B × H)",
      value: `${dimStr(length)} × ${dimStr(breadth)} × ${dimStr(height)}`,
    });
  } else if (product.dimensions) {
    rows.push({ label: "Dimensions", value: product.dimensions });
  }

  if (weight !== undefined && weight !== null && String(weight).trim() !== "") {
    const num = Number(weight);
    rows.push({
      label: "Weight",
      value: Number.isFinite(num) ? `${num} g` : String(weight),
    });
  }

  if (product.tags && product.tags.length > 0) {
    rows.push({
      label: "Tags",
      value: product.tags.map((t) => t.name).join(", "),
    });
  }

  if (product.attributes && product.attributes.length > 0) {
    for (const attr of product.attributes) {
      if (!attr.values || attr.values.length === 0) continue;
      rows.push({ label: attr.name, value: attr.values.join(", ") });
    }
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-[var(--text-tertiary)]">
        No additional details for this product.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-primary)]">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.label + idx}
              className="border-b border-[var(--border-primary)] last:border-0"
            >
              <td className="w-1/3 bg-[var(--bg-secondary)] px-4 py-3 font-medium text-[var(--text-secondary)]">
                {row.label}
              </td>
              <td className="px-4 py-3 text-[var(--text-primary)]">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
