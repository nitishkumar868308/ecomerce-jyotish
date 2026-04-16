"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAddToCart } from "@/services/cart";
import { usePriceConverter } from "@/hooks/usePriceConverter";
import { ROUTES } from "@/config/routes";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { format } = usePriceConverter();
  const addToCart = useAddToCart();

  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const thumbnail = product.thumbnail || product.images?.[0] || "/placeholder.png";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart.mutate({ productId: product.id, quantity: 1 });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

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

            {/* Wishlist Button */}
            <button
              onClick={handleWishlist}
              className={cn(
                "absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-card)]/80 backdrop-blur-sm transition-all duration-200 hover:bg-[var(--bg-card)]",
                isWishlisted && "text-[var(--accent-danger)]"
              )}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className="h-4 w-4"
                fill={isWishlisted ? "currentColor" : "none"}
              />
            </button>

            {/* Add to Cart - visible on hover (desktop) / always visible (mobile) */}
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 z-10 p-3 transition-all duration-300",
                "translate-y-0 opacity-100 md:translate-y-full md:opacity-0",
                isHovered && "md:translate-y-0 md:opacity-100"
              )}
            >
              <Button
                size="sm"
                fullWidth
                onClick={handleAddToCart}
                loading={addToCart.isPending}
                leftIcon={<ShoppingCart className="h-4 w-4" />}
                className="backdrop-blur-sm"
              >
                Add to Cart
              </Button>
            </div>

            {/* Out of Stock Overlay */}
            {product.stock === 0 && (
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

            {/* Rating */}
            <div className="mt-1.5 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5",
                    i < 4
                      ? "fill-[var(--accent-warning)] text-[var(--accent-warning)]"
                      : "text-[var(--border-primary)]"
                  )}
                />
              ))}
              <span className="ml-1 text-xs text-[var(--text-secondary)]">(4.0)</span>
            </div>

            {/* Price */}
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-base font-bold text-[var(--text-primary)] sm:text-lg">
                {format(product.price)}
              </span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-sm text-[var(--text-secondary)] line-through">
                  {format(product.mrp)}
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
