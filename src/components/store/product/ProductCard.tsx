"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { usePriceConverter } from "@/hooks/usePriceConverter";
import { ROUTES } from "@/config/routes";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { format } = usePriceConverter();

  const price = Number(product.price) || 0;
  const mrp = Number(product.MRP) || 0;
  const discount = mrp > 0 && mrp > price
    ? Math.round(((mrp - price) / mrp) * 100)
    : 0;

  const thumbnail = product.image?.[0] || "/placeholder.png";

  return (
    <motion.div
      className={cn("group relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={ROUTES.PRODUCT(product.slug || product.id)} className="block">
        <div className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-[var(--bg-secondary)]">
            <Image
              src={thumbnail}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-cover transition-transform duration-500",
                isHovered && "scale-110"
              )}
            />

            {/* Discount Badge */}
            {discount > 0 && (
              <Badge
                variant="danger"
                className="absolute left-2 top-2 z-10"
              >
                -{discount}%
              </Badge>
            )}

            {/* Out of Stock Overlay */}
            {Number(product.stock) === 0 && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--bg-overlay)]">
                <span className="rounded-lg bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]">
                  Out of Stock
                </span>
              </div>
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
                {product.currencySymbol || ""}{product.price}
              </span>
              {mrp > price && (
                <span className="text-sm text-[var(--text-secondary)] line-through">
                  {product.currencySymbol || ""}{product.MRP}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default ProductCard;
