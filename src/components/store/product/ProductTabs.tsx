"use client";

import { useState } from "react";
import DOMPurify from "dompurify";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReviewSection } from "./ReviewSection";
import { ProductDetailsTable } from "./ProductDetailsTable";
import type { Product, ProductVariation } from "@/types/product";

interface ProductTabsProps {
  product: Product;
  selectedVariation?: ProductVariation | null;
}

type TabKey = "description" | "details" | "reviews";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "description", label: "Description" },
  { key: "details", label: "Product Details" },
  { key: "reviews", label: "Reviews & Rating" },
];

export function ProductTabs({ product, selectedVariation }: ProductTabsProps) {
  const [active, setActive] = useState<TabKey>("description");

  const variationDescription = (selectedVariation as { description?: string } | null | undefined)
    ?.description?.trim();
  const rawDescription = variationDescription || product.description || "";
  const safeDescription =
    typeof window !== "undefined" && rawDescription
      ? DOMPurify.sanitize(rawDescription, { USE_PROFILES: { html: true } })
      : rawDescription;

  return (
    <section className="mt-10 border-t border-[var(--border-primary)] pt-6">
      <div
        role="tablist"
        aria-label="Product information"
        className="scrollbar-hide -mx-4 mb-5 flex items-center gap-6 overflow-x-auto border-b border-[var(--border-primary)] px-4 md:mx-0 md:px-0"
      >
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.key)}
              className={cn(
                "relative whitespace-nowrap pb-3 pt-2 text-sm font-medium transition-colors outline-none",
                "focus-visible:text-[var(--accent-primary)]",
                isActive
                  ? "text-[var(--accent-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {tab.label}
              {isActive && (
                <motion.span
                  layoutId="product-tab-underline"
                  className="absolute inset-x-0 -bottom-[1px] h-[2px] rounded-full bg-[var(--accent-primary)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="min-h-[200px]">
        {active === "description" && (
          <div
            className="prose prose-sm max-w-none text-[var(--text-primary)] dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: safeDescription || "<p>No description provided.</p>",
            }}
          />
        )}
        {active === "details" && (
          <ProductDetailsTable
            product={product}
            selectedVariation={selectedVariation ?? null}
          />
        )}
        {active === "reviews" && <ReviewSection productId={product.id} />}
      </div>
    </section>
  );
}
