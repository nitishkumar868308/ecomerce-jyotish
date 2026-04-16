"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  Shield,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { useAddToCart } from "@/services/cart";
import { usePriceConverter } from "@/hooks/usePriceConverter";
import { ProductImages } from "./ProductImages";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { ReviewSection } from "./ReviewSection";
import type { Product, ProductVariation } from "@/types/product";

interface ProductDetailProps {
  product: Product;
  className?: string;
}

const DETAIL_TABS = [
  { id: "description", label: "Description" },
  { id: "reviews", label: "Reviews" },
  { id: "shipping", label: "Shipping Info" },
];

export function ProductDetail({ product, className }: ProductDetailProps) {
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(
    product.variations?.[0] ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { format } = usePriceConverter();
  const addToCart = useAddToCart();

  const activePrice = selectedVariation?.price ?? product.price;
  const activeMrp = selectedVariation?.mrp ?? product.mrp;
  const activeStock = selectedVariation?.stock ?? product.stock;

  const discount = activeMrp && activeMrp > activePrice
    ? Math.round(((activeMrp - activePrice) / activeMrp) * 100)
    : 0;

  const images = useMemo(() => {
    const imgs = [...(product.images || [])];
    if (selectedVariation?.image && !imgs.includes(selectedVariation.image)) {
      imgs.unshift(selectedVariation.image);
    }
    return imgs;
  }, [product.images, selectedVariation]);

  const handleAddToCart = () => {
    addToCart.mutate({
      productId: product.id,
      variationId: selectedVariation?.id,
      quantity,
    });
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(prev + delta, activeStock)));
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className={cn("space-y-10", className)}>
      {/* Top Section: Images + Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
        {/* Left: Images */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ProductImages images={images} productName={product.name} />
        </motion.div>

        {/* Right: Product Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col"
        >
          {/* Category */}
          {product.category && (
            <p className="text-sm font-medium uppercase tracking-wider text-[var(--accent-primary)]">
              {product.category.name}
            </p>
          )}

          {/* Name */}
          <h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
            {product.name}
          </h1>

          {/* SKU */}
          {product.sku && (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              SKU: {product.sku}
            </p>
          )}

          {/* Rating */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < 4
                      ? "fill-[var(--accent-warning)] text-[var(--accent-warning)]"
                      : "text-[var(--border-primary)]"
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-[var(--text-secondary)]">(4.0)</span>
          </div>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-[var(--text-primary)]">
              {format(activePrice)}
            </span>
            {activeMrp && activeMrp > activePrice && (
              <span className="text-lg text-[var(--text-secondary)] line-through">
                {format(activeMrp)}
              </span>
            )}
            {discount > 0 && (
              <Badge variant="success" size="md">
                {discount}% OFF
              </Badge>
            )}
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="mt-4 leading-relaxed text-[var(--text-secondary)]">
              {product.shortDescription}
            </p>
          )}

          {/* Divider */}
          <div className="my-5 border-t border-[var(--border-primary)]" />

          {/* Variations */}
          {product.variations && product.variations.length > 0 && (
            <div className="mb-5">
              <ProductVariantSelector
                variations={product.variations}
                selectedId={selectedVariation?.id}
                onSelect={setSelectedVariation}
              />
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Quantity
            </label>
            <div className="inline-flex items-center rounded-lg border border-[var(--border-primary)]">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="flex h-10 w-10 items-center justify-center text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex h-10 w-12 items-center justify-center border-x border-[var(--border-primary)] text-sm font-semibold text-[var(--text-primary)]">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= activeStock}
                className="flex h-10 w-10 items-center justify-center text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Stock Status */}
          <div className="mb-5 flex items-center gap-2">
            {activeStock > 0 ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-[var(--accent-success)]" />
                <span className="text-sm font-medium text-[var(--accent-success)]">
                  {activeStock > 10 ? "In Stock" : `Only ${activeStock} left`}
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-[var(--accent-danger)]" />
                <span className="text-sm font-medium text-[var(--accent-danger)]">
                  Out of Stock
                </span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              fullWidth
              onClick={handleAddToCart}
              loading={addToCart.isPending}
              disabled={activeStock === 0}
              leftIcon={<ShoppingCart className="h-5 w-5" />}
            >
              Add to Cart
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsWishlisted(!isWishlisted)}
              className={cn(
                "shrink-0",
                isWishlisted && "border-[var(--accent-danger)] text-[var(--accent-danger)]"
              )}
              leftIcon={
                <Heart
                  className="h-5 w-5"
                  fill={isWishlisted ? "currentColor" : "none"}
                />
              }
            >
              Wishlist
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleShare}
              className="shrink-0"
              aria-label="Share product"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: Truck, label: "Free Shipping" },
              { icon: RotateCcw, label: "Easy Returns" },
              { icon: Shield, label: "Secure Payment" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3 text-center"
              >
                <Icon className="h-5 w-5 text-[var(--accent-primary)]" />
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Section: Tabs */}
      <div>
        <Tabs tabs={DETAIL_TABS} activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-6">
          {activeTab === "description" && (
            <motion.div
              key="description"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose max-w-none text-[var(--text-secondary)]"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          {activeTab === "reviews" && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ReviewSection productId={product.id} />
            </motion.div>
          )}

          {activeTab === "shipping" && (
            <motion.div
              key="shipping"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 text-[var(--text-secondary)]"
            >
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-primary)]" />
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)]">Shipping</h4>
                  <p className="text-sm">
                    Free standard shipping on orders above a minimum value. Standard
                    delivery takes 5-7 business days. Express delivery available at
                    checkout.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-primary)]" />
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)]">Returns</h4>
                  <p className="text-sm">
                    Easy returns within 7 days of delivery. Items must be in
                    original packaging and unused condition.
                  </p>
                </div>
              </div>
              {product.weight && (
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-primary)]" />
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)]">Product Details</h4>
                    <p className="text-sm">
                      Weight: {product.weight}g
                      {product.dimensions && ` | Dimensions: ${product.dimensions}`}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
