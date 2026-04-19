"use client";

import { usePrice } from "@/hooks/usePrice";
import type { Product } from "@/types/product";

interface ProductDetailsTableProps {
  product: Product;
}

interface Row {
  label: string;
  value: string;
}

export function ProductDetailsTable({ product }: ProductDetailsTableProps) {
  const { format } = usePrice();

  const rows: Row[] = [];
  if (product.name) rows.push({ label: "Name", value: product.name });
  if (product.price) rows.push({ label: "Price", value: format(product.price) });
  if (product.sku) rows.push({ label: "SKU", value: String(product.sku) });

  // `length`, `width`, `breadth`, `height` are not declared on Product type — keep casts
  const dim = {
    length: (product as any).length,
    width: (product as any).width ?? (product as any).breadth,
    height: (product as any).height,
  };
  if (dim.length || dim.width || dim.height) {
    rows.push({
      label: "Dimensions (L × W × H)",
      value: `${dim.length ?? "-"} × ${dim.width ?? "-"} × ${dim.height ?? "-"}`,
    });
  } else if (product.dimensions) {
    rows.push({ label: "Dimensions", value: product.dimensions });
  }

  // `weight` is typed as `number` on Product
  if (product.weight) rows.push({ label: "Weight", value: String(product.weight) });

  // `tags` is typed as `Tag[]` on Product
  if (product.tags && product.tags.length > 0) {
    rows.push({
      label: "Tags",
      value: product.tags.map((t) => t.name).join(", "),
    });
  }

  // `attributes` is typed as `ProductAttribute[]` (id, name, values[]) on Product
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
