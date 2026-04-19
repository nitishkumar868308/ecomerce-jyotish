"use client";

import { useState } from "react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";
import { ReviewSection } from "./ReviewSection";
import { ProductDetailsTable } from "./ProductDetailsTable";
import type { Product } from "@/types/product";

interface ProductTabsProps {
  product: Product;
}

type TabKey = "description" | "details" | "reviews";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "description", label: "Description" },
  { key: "details", label: "Product Details" },
  { key: "reviews", label: "Reviews & Rating" },
];

export function ProductTabs({ product }: ProductTabsProps) {
  const [active, setActive] = useState<TabKey>("description");

  const safeDescription =
    typeof window !== "undefined" && product.description
      ? DOMPurify.sanitize(product.description, { USE_PROFILES: { html: true } })
      : product.description ?? "";

  return (
    <section className="mt-10 border-t border-[var(--border-primary)] pt-6">
      <div className="scrollbar-hide -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              "relative whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active === tab.key
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                : "border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[200px]">
        {active === "description" && (
          <div
            className="prose prose-sm max-w-none text-[var(--text-primary)] dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: safeDescription || "<p>No description provided.</p>" }}
          />
        )}
        {active === "details" && <ProductDetailsTable product={product} />}
        {active === "reviews" && <ReviewSection productId={product.id} />}
      </div>
    </section>
  );
}
