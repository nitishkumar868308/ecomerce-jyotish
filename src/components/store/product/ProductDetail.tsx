"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrice } from "@/hooks/usePrice";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from "@/services/cart";
import { useAuthStore } from "@/stores/useAuthStore";
import { calculateOffer } from "@/lib/offers";
import { ProductImages } from "./ProductImages";
import { OfferList } from "./OfferList";
import { BulkPricingList } from "./BulkPricingList";
import { ProductDescription } from "./ProductDescription";
import { QuantityControl } from "@/components/store/shared/QuantityControl";
import { ProductVariationGrid } from "./ProductVariationGrid";
import { ProductTabs } from "./ProductTabs";
import type { Product, ProductVariation } from "@/types/product";

interface ProductDetailProps {
  product: Product;
  className?: string;
}


export function ProductDetail({ product, className }: ProductDetailProps) {
  const { format } = usePrice();

  const sortedVariations = useMemo(() => {
    const arr = [...(product.variations ?? [])];
    arr.sort((a, b) => {
      const ao = (a as { sortOrder?: number }).sortOrder ?? 999999;
      const bo = (b as { sortOrder?: number }).sortOrder ?? 999999;
      return ao - bo;
    });
    return arr;
  }, [product.variations]);

  const [selectedVariation, setSelectedVariation] =
    useState<ProductVariation | null>(sortedVariations[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuthStore();
  const addToCart = useAddToCart();
  const updateCart = useUpdateCartItem();
  const removeCart = useRemoveCartItem();
  const { data: cartItems } = useCart();

  const activePrice = selectedVariation?.price
    ? Number(selectedVariation.price)
    : Number(product.price) || 0;
  const activeMrp = selectedVariation?.MRP
    ? Number(selectedVariation.MRP)
    : selectedVariation?.mrp
      ? Number(selectedVariation.mrp)
      : Number(product.MRP) || 0;
  const activeStock = selectedVariation?.stock
    ? Number(selectedVariation.stock)
    : Number(product.stock) || 0;

  const variationOffer = useMemo(() => {
    if (!selectedVariation?.offerId) return null;
    return (
      (product.offers ?? []).find(
        (o) => o.id === selectedVariation.offerId,
      ) ?? null
    );
  }, [selectedVariation, product.offers]);

  const primaryOffer =
    variationOffer || product.primaryOffer || product.offers?.[0] || null;
  const offerResult = calculateOffer(activePrice, primaryOffer);

  const discount =
    activeMrp && activeMrp > activePrice
      ? Math.round(((activeMrp - activePrice) / activeMrp) * 100)
      : 0;

  // Resolve gallery images: variation images first, then base product images
  const baseImages = (product.image ?? [])
    .map((s) => resolveAssetUrl(s))
    .filter(Boolean) as string[];
  const variationImages = (() => {
    if (!selectedVariation?.image) return [] as string[];
    const raw = Array.isArray(selectedVariation.image)
      ? selectedVariation.image
      : [selectedVariation.image];
    return raw.map((s) => resolveAssetUrl(s)).filter(Boolean) as string[];
  })();
  const gallery = Array.from(new Set([...variationImages, ...baseImages]));
  const finalGallery = gallery.length > 0 ? gallery : ["/placeholder.png"];

  const activeShort =
    (selectedVariation as { short?: string } | null)?.short?.trim() ||
    (product as { short?: string }).short?.trim() ||
    "";
  const activeDescription =
    (selectedVariation as { description?: string } | null)?.description?.trim() ||
    product.description ||
    "";

  // Parse each variation's attributes (try structured attributes first, fallback to variationName)
  const parsedVariations = useMemo(() => {
    const parsed = new Map<string, Record<string, string>>();
    for (const v of sortedVariations) {
      const attrs =
        v.attributes && Object.keys(v.attributes).length > 0
          ? v.attributes
          : (() => {
              const name = v.variationName ?? "";
              if (!name) return {};
              return name.split("/").reduce<Record<string, string>>((acc, chunk) => {
                const colonIdx = chunk.indexOf(":");
                if (colonIdx > 0) {
                  const k = chunk.slice(0, colonIdx).trim();
                  const val = chunk.slice(colonIdx + 1).trim();
                  if (k && val) acc[k] = val;
                }
                return acc;
              }, {});
            })();
      parsed.set(v.id, attrs);
    }
    return parsed;
  }, [sortedVariations]);

  // Track selected attributes across all groups
  const selectedAttrs = useMemo(() => {
    if (!selectedVariation) return {} as Record<string, string>;
    return parsedVariations.get(selectedVariation.id) || {};
  }, [selectedVariation, parsedVariations]);

  // Find the cart item matching current selected attributes
  const currentCartItem = useMemo(() => {
    if (!cartItems) return null;
    return cartItems.find((ci) => {
      if (ci.productId !== product.id) return false;
      const ciAttrs = (ci.attributes || {}) as Record<string, string>;
      const keys1 = Object.keys(selectedAttrs).sort();
      const keys2 = Object.keys(ciAttrs).sort();
      if (keys1.length !== keys2.length) return false;
      return keys1.every((k, i) => k === keys2[i] && selectedAttrs[k] === ciAttrs[k]);
    }) ?? null;
  }, [cartItems, product.id, selectedAttrs]);

  const cartQty = currentCartItem?.quantity ?? 0;
  const isInCart = cartQty > 0;

  // Build a per-variation cart count map keyed by variationId
  const cartCountByVariationId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cartItems ?? []) {
      if (!item.variationId) continue;
      map[item.variationId] = (map[item.variationId] ?? 0) + item.quantity;
    }
    return map;
  }, [cartItems]);

  // Total qty of this product across all colors (for bulk check)
  const totalProductQty = useMemo(() => {
    if (!cartItems) return 0;
    return cartItems
      .filter((ci) => ci.productId === product.id)
      .reduce((sum, ci) => sum + ci.quantity, 0);
  }, [cartItems, product.id]);

  // Bulk price info
  const bulkMinQty = Number(product.minQuantity) || 0;
  const bulkPrice = Number(product.bulkPrice) || 0;
  const isBulkActive = bulkMinQty > 0 && bulkPrice > 0 && totalProductQty >= bulkMinQty;

  // Effective display price considering bulk
  const displayPrice = isBulkActive ? bulkPrice : (offerResult.hasOffer ? offerResult.discountedPrice : activePrice);

  const handleAddToCart = () => {
    addToCart.mutate({
      productId: product.id,
      variationId: selectedVariation ? String(selectedVariation.id) : undefined,
      productName: product.name,
      quantity,
      pricePerItem: offerResult.hasOffer
        ? offerResult.discountedPrice
        : activePrice,
      currencySymbol: product.currencySymbol || "₹",
      totalPrice:
        (offerResult.hasOffer ? offerResult.discountedPrice : activePrice) *
        quantity,
      attributes: selectedAttrs,
      image: finalGallery[0],
      userId: user?.id,
      selectedCountry: product.currency || undefined,
      currency: product.currency || undefined,
      barCode: product.barCode || undefined,
      bulkPrice: product.bulkPrice ? Number(product.bulkPrice) : undefined,
      bulkMinQty: product.minQuantity ? Number(product.minQuantity) : undefined,
      offerApplied: offerResult.hasOffer,
      productOfferApplied: offerResult.hasOffer,
      productOfferId: primaryOffer?.id,
    });
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) =>
      Math.max(1, Math.min(prev + delta, activeStock || 999))
    );
  };

  const handleVariationSelect = (variation: ProductVariation) => {
    setSelectedVariation(variation);
    setQuantity(1);
  };

  return (
    <div className={cn("pb-20 lg:pb-0", className)}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
        {/* Left: Images */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ProductImages images={finalGallery} productName={product.name} />
        </motion.div>

        {/* Right: Product Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col"
        >
          {/* Name */}
          <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
            {product.name}
          </h1>

          {/* Short description */}
          {activeShort ? (
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {activeShort}
            </p>
          ) : null}

          {/* Price */}
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            {offerResult.hasOffer ? (
              <>
                <span className="text-3xl font-bold text-[var(--accent-success)]">
                  {format(offerResult.discountedPrice)}
                </span>
                <span className="text-lg text-[var(--text-secondary)] line-through">
                  {format(activePrice)}
                </span>
                <span className="text-sm font-semibold text-[var(--accent-success)]">
                  {offerResult.discountLabel}
                </span>
              </>
            ) : (
              <>
                <span className="text-3xl font-bold text-[var(--text-primary)]">
                  {format(activePrice)}
                </span>
                {activeMrp > 0 && activeMrp > activePrice && (
                  <>
                    <span className="text-lg text-[var(--text-secondary)] line-through">
                      {format(activeMrp)}
                    </span>
                    <span className="text-sm font-semibold text-[var(--accent-success)]">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </>
            )}
          </div>

          {/* Offers + Bulk Price */}
          {((product.primaryOffer && product.primaryOffer.active) ||
            (Array.isArray(product.offers) && product.offers.some((o) => o.active)) ||
            (parseFloat(product.bulkPrice ?? "0") > 0 &&
              parseInt(product.minQuantity ?? "0", 10) > 0)) && (
            <OfferList
              offers={product.offers}
              bulkPrice={product.bulkPrice}
              minQuantity={product.minQuantity}
              claimedOfferIds={
                cartItems
                  ?.filter((ci) => ci.productId === product.id && ci.offerSummary?.claimed)
                  .map((ci) => ci.offerSummary!.offerId) ?? []
              }
              bulkApplied={isBulkActive}
            />
          )}

          {/* Bulk pricing tiers */}
          <div className="mt-3">
            <BulkPricingList
              tiers={
                ((product as { bulkPricingTiers?: Array<{ qty: number; unitPrice: number }> })
                  .bulkPricingTiers) ?? []
              }
              currencySymbol={product.currencySymbol || "₹"}
              activeQty={totalProductQty}
            />
          </div>

          {/* Divider */}
          <div className="my-5 border-t border-[var(--border-primary)]" />

          {/* Variations */}
          {sortedVariations && sortedVariations.length > 0 && (
            <div className="mb-5">
              <ProductVariationGrid
                variations={sortedVariations}
                selectedId={selectedVariation?.id ?? null}
                onSelect={(v) => handleVariationSelect(v)}
                cartCountByVariationId={cartCountByVariationId}
              />
            </div>
          )}

          {/* Bulk price indicator */}
          {parseFloat(product.bulkPrice ?? "0") > 0 &&
            parseInt(product.minQuantity ?? "0", 10) > 0 && (
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950/20">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  {isBulkActive
                    ? `Bulk price active: ${format(bulkPrice)} each (${totalProductQty} total in cart)`
                    : `Buy ${parseInt(product.minQuantity ?? "0", 10)}+ units to get ${format(bulkPrice)} each`}
                </p>
              </div>
            )}

          {/* Desktop: Quantity + Add to Cart OR Increment/Decrement */}
          <div className="hidden lg:block">
            {isInCart ? (
              <div className="grid grid-cols-2 gap-3">
                <QuantityControl
                  quantity={cartQty}
                  onIncrement={() => updateCart.mutate({ id: currentCartItem!.id, quantity: cartQty + 1 })}
                  onDecrement={() => updateCart.mutate({ id: currentCartItem!.id, quantity: cartQty - 1 })}
                  onDelete={() => removeCart.mutate(currentCartItem!.id)}
                  maxQuantity={activeStock || 999}
                  disabled={updateCart.isPending || removeCart.isPending}
                  itemName={product.name}
                  deleteLoading={removeCart.isPending}
                  className="w-full justify-center"
                />
                <div className="flex items-center justify-center rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 text-sm font-medium text-[var(--text-secondary)]">
                  {cartQty} in cart · {format(displayPrice * cartQty)}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <QuantityControl
                  quantity={quantity}
                  onIncrement={() => handleQuantityChange(1)}
                  onDecrement={() => handleQuantityChange(-1)}
                  onDelete={() => {}}
                  maxQuantity={activeStock || 999}
                  showDelete={false}
                  className="w-full justify-center"
                />
                <button
                  onClick={handleAddToCart}
                  disabled={addToCart.isPending || activeStock === 0}
                  className="flex items-center justify-center gap-2.5 rounded-xl bg-[var(--accent-primary)] px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[var(--accent-primary-hover)] disabled:pointer-events-none disabled:opacity-50"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Tags</p>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Long description */}
      {activeDescription && <ProductDescription html={activeDescription} />}

      {/* Tabs: Description / Product Details / Reviews & Rating */}
      <ProductTabs product={product} />

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex items-stretch gap-3 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] lg:hidden">
        {isInCart ? (
          <>
            <QuantityControl
              quantity={cartQty}
              onIncrement={() => updateCart.mutate({ id: currentCartItem!.id, quantity: cartQty + 1 })}
              onDecrement={() => updateCart.mutate({ id: currentCartItem!.id, quantity: cartQty - 1 })}
              onDelete={() => removeCart.mutate(currentCartItem!.id)}
              maxQuantity={activeStock || 999}
              disabled={updateCart.isPending || removeCart.isPending}
              itemName={product.name}
              deleteLoading={removeCart.isPending}
              size="sm"
            />
            <div className="flex flex-1 items-center justify-center rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-sm font-medium text-[var(--text-secondary)]">
              {cartQty} in cart · {format(displayPrice * cartQty)}
            </div>
          </>
        ) : (
          <>
            <QuantityControl
              quantity={quantity}
              onIncrement={() => handleQuantityChange(1)}
              onDecrement={() => handleQuantityChange(-1)}
              onDelete={() => {}}
              maxQuantity={activeStock || 999}
              showDelete={false}
              size="sm"
            />
            <button
              onClick={handleAddToCart}
              disabled={addToCart.isPending || activeStock === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-primary-hover)] disabled:pointer-events-none disabled:opacity-50"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;
