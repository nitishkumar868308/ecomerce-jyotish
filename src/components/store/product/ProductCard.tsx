"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePrice } from "@/hooks/usePrice";
import { productImage } from "@/lib/assetUrl";
import { ROUTES } from "@/config/routes";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { format } = usePrice();
  const imgSrc = productImage(product, 0);
  const pathname = usePathname();
  const isQuickGo = pathname.startsWith("/hecate-quickgo");
  // Keep the product URL on the same site variant the user is browsing,
  // otherwise a QuickGo listing would throw them back to the wizard PDP.
  const productHref = isQuickGo
    ? ROUTES.QUICKGO.PRODUCT(product.slug || product.id)
    : ROUTES.PRODUCT(product.slug || product.id);

  // QuickGo-only stock badge. Backend attaches `quickgoStock` (aggregated
  // across matched warehouse stocks) to every product returned by the
  // QuickGo listing. We surface it as a green "In stock" pill normally,
  // and flip to amber "Only N left" when the count crosses under 20 so
  // the shopper senses urgency without us having to hide the product.
  const quickGoStockRaw = (product as Product & { quickgoStock?: number })
    .quickgoStock;
  const quickGoStock =
    typeof quickGoStockRaw === "number" && Number.isFinite(quickGoStockRaw)
      ? quickGoStockRaw
      : null;
  const showQuickGoBadge = isQuickGo && quickGoStock !== null;
  const isLowStock = showQuickGoBadge && quickGoStock !== null && quickGoStock < 20;

  // MRP / "% OFF" / strikethrough removed at product owner's request — card
  // only shows the live price (which already reflects any active offer).

  return (
    <motion.div
      className={cn("group relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={productHref} className="block">
        <div className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-[var(--bg-secondary)]">
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-cover transition-transform duration-500",
                isHovered && "scale-110"
              )}
            />

            {/* Out of Stock Overlay */}
            {Number(product.stock) === 0 && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--bg-overlay)]">
                <span className="rounded-lg bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]">
                  Out of Stock
                </span>
              </div>
            )}

            {/* QuickGo stock badge — top-right of the image. Amber when
                stock is running low so the shopper reads urgency before
                green. */}
            {showQuickGoBadge && quickGoStock !== null && quickGoStock > 0 && (
              <span
                className={cn(
                  "absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm sm:text-xs",
                  isLowStock
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-500/95 text-white",
                )}
              >
                {isLowStock
                  ? `Only ${quickGoStock} left`
                  : `In stock · ${quickGoStock}`}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4">
            {/* Category */}
            {product.category && (
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                {product.category.name}
              </p>
            )}

            {/* Name */}
            <h3 className="line-clamp-2 text-sm font-semibold text-[var(--text-primary)] sm:text-base">
              {product.name}
            </h3>

            {/* Price */}
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-base font-bold text-[var(--text-primary)] sm:text-lg">
                <span>{format(product.price)}</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default ProductCard;
