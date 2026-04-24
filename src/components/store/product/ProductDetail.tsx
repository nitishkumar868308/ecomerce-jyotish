"use client";

import React, { useState, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
import { QuantityControl } from "@/components/store/shared/QuantityControl";
import { ProductVariationGrid } from "./ProductVariationGrid";
import { ProductTabs } from "./ProductTabs";
import type { Product, ProductVariation } from "@/types/product";
import type { CartItem } from "@/types/cart";

interface ProductDetailProps {
  product: Product;
  className?: string;
  /**
   * When true, the variation picker drops chips the shopper can't pick
   * (out of stock or not in catalogue for the current selection) rather
   * than showing them greyed-out. Used on QuickGo where the list is
   * already narrowed to locally-stocked variations — a strike-through
   * "Unavailable" chip there is just noise.
   */
  hideUnavailableVariations?: boolean;
}


export function ProductDetail({
  product,
  className,
  hideUnavailableVariations = false,
}: ProductDetailProps) {
  const { format } = usePrice();

  const sortedVariations = useMemo(() => {
    // Hide variations the admin has toggled inactive or soft-deleted —
    // storefront shouldn't let the shopper pick something we won't ship.
    const arr = (product.variations ?? []).filter((v) => {
      if ((v as { deleted?: number }).deleted === 1) return false;
      if ((v as { active?: boolean }).active === false) return false;
      return true;
    });
    arr.sort((a, b) => {
      const ao = (a as { sortOrder?: number }).sortOrder ?? 999999;
      const bo = (b as { sortOrder?: number }).sortOrder ?? 999999;
      return ao - bo;
    });
    return arr;
  }, [product.variations]);

  // Pre-select the variation a deep-link points to (e.g. header search
  // result `?variation=<id>`) — falls back to the first sorted variation
  // when the id isn't present or doesn't match one we're rendering.
  const searchParams = useSearchParams();
  const requestedVariationId = searchParams?.get("variation") ?? null;
  const initialVariation = useMemo(() => {
    if (requestedVariationId) {
      const hit = sortedVariations.find(
        (v) => String(v.id) === requestedVariationId,
      );
      if (hit) return hit;
    }
    return sortedVariations[0] ?? null;
    // Stable on mount — we don't want the picker jumping when the user
    // manually switches variations (which would push a new URL and
    // retrigger this memo otherwise).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);
  const [selectedVariation, setSelectedVariation] =
    useState<ProductVariation | null>(initialVariation);
  const [quantity, setQuantity] = useState(1);
  const { user, isLoggedIn } = useAuthStore();
  const addToCart = useAddToCart();
  const updateCart = useUpdateCartItem();
  const removeCart = useRemoveCartItem();
  const { data: cartResponse } = useCart();
  const cartItemsRaw = cartResponse?.items;
  const pathname = usePathname();

  // The cart lives in the user's account but items are tagged with the
  // storefront they were added from (`purchasePlatform`). A product can exist
  // on multiple storefronts (wizard + quickgo), so filter the cart down to
  // just the current variant — otherwise a wizard add-to-cart would make the
  // QuickGo PDP look like the item was already in the cart (and vice versa).
  // Also guards against rendering stale cart data before logout has
  // cleared — if the shopper isn't logged in there's simply no cart.
  const currentPlatform: "wizard" | "quickgo" = pathname?.startsWith(
    "/hecate-quickgo",
  )
    ? "quickgo"
    : "wizard";
  const cartItems = useMemo<CartItem[] | undefined>(() => {
    if (!isLoggedIn) return [];
    if (!cartItemsRaw) return undefined;
    return cartItemsRaw.filter((ci) => {
      const p = String(ci.purchasePlatform ?? "").toLowerCase();
      // Legacy rows without a platform fall back to wizard so we don't hide
      // them from the wizard UI where they originally landed.
      const normalised = p === "quickgo" || p === "hecate-quickgo"
        ? "quickgo"
        : "wizard";
      return normalised === currentPlatform;
    });
  }, [cartItemsRaw, currentPlatform, isLoggedIn]);

  const activePrice = selectedVariation?.price
    ? Number(selectedVariation.price)
    : Number(product.price) || 0;
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
  const offerResult = calculateOffer(activePrice, primaryOffer, quantity);

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

  // Parse each variation's attributes. Tries in order:
  //   1. the plain `attributes` map (admin form sometimes sends this directly)
  //   2. the structured `attributeCombo` JSON array from the DB
  //   3. the display name, split on "/", "·", ",", or "|"
  const parsedVariations = useMemo(() => {
    const parsed = new Map<string, Record<string, string>>();
    for (const v of sortedVariations) {
      const attrs: Record<string, string> = {};

      if (
        v.attributes &&
        !Array.isArray(v.attributes) &&
        Object.keys(v.attributes).length > 0
      ) {
        Object.assign(attrs, v.attributes);
      } else {
        const combo = (v as { attributeCombo?: unknown }).attributeCombo;
        if (Array.isArray(combo)) {
          for (const entry of combo) {
            if (
              entry &&
              typeof entry === "object" &&
              "name" in entry &&
              "value" in entry
            ) {
              const k = String((entry as { name: unknown }).name ?? "").trim();
              const val = String(
                (entry as { value: unknown }).value ?? "",
              ).trim();
              if (k && val) attrs[k] = val;
            }
          }
        }
        if (Object.keys(attrs).length === 0) {
          const name = v.variationName ?? "";
          if (name) {
            for (const chunk of name.split(/[\/·,|]/)) {
              const colonIdx = chunk.indexOf(":");
              if (colonIdx <= 0) continue;
              const k = chunk.slice(0, colonIdx).trim();
              const val = chunk.slice(colonIdx + 1).trim();
              if (k && val) attrs[k] = val;
            }
          }
        }
      }

      parsed.set(v.id, attrs);
    }
    return parsed;
  }, [sortedVariations]);

  // Track selected attributes across all groups
  const selectedAttrs = useMemo(() => {
    if (!selectedVariation) return {} as Record<string, string>;
    return parsedVariations.get(selectedVariation.id) || {};
  }, [selectedVariation, parsedVariations]);

  // Match the cart item by the canonical ids the server stores — product
  // + variation. The previous attribute-hash match broke whenever the
  // backend normalised the attributes map differently from the client, and
  // left the "Add to cart" button showing for items that were in fact
  // already in the cart (which is how the duplicate adds were happening).
  const selectedVariationId = selectedVariation
    ? String(selectedVariation.id)
    : undefined;
  const currentCartItem = useMemo(() => {
    if (!cartItems) return null;
    return (
      cartItems.find((ci) => {
        if (ci.productId !== product.id) return false;
        if (selectedVariationId) {
          return String(ci.variationId ?? "") === selectedVariationId;
        }
        // Product without a selected variation (simple product) — match on
        // productId alone and only rows with no variation.
        return !ci.variationId;
      }) ?? null
    );
  }, [cartItems, product.id, selectedVariationId]);

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

  // Total qty of this product in the SAME offer/bulk group as the
  // currently-selected variation — mirrors the server's cart grouping
  // (productId + attributes, minus any keys the admin configured as
  // `offerIgnoreAttributes`). Using the narrower group here keeps the
  // product-detail "Applied" badge honest: adding qty under a different
  // form/wax no longer inflates the bulk check for the one you're
  // looking at. Cart + checkout continue to use the server's group math.
  // Must match the backend rule exactly so the "Applied" badge here
  // agrees with what cart.service + orders.service compute: ignore
  // Color, nothing else. Same-product + same non-colour attributes =
  // one offer / bulk bucket.
  const offerIgnoreSet = useMemo(() => new Set(["color"]), []);
  const totalProductQty = useMemo(() => {
    if (!cartItems) return 0;
    const selectedKeys = Object.keys(selectedAttrs).filter(
      (k) => !offerIgnoreSet.has(k.toLowerCase()),
    );
    return cartItems
      .filter((ci) => {
        if (ci.productId !== product.id) return false;
        // Empty selection (simple product, no attributes) — include all
        // lines for this product, same as the old behaviour.
        if (selectedKeys.length === 0) return true;
        const ciAttrs = (ci.attributes || {}) as Record<string, string>;
        return selectedKeys.every((k) => ciAttrs[k] === selectedAttrs[k]);
      })
      .reduce((sum, ci) => sum + ci.quantity, 0);
  }, [cartItems, product.id, selectedAttrs, offerIgnoreSet]);

  // Bulk price info. The "effective" quantity mirrors the offer logic: once
  // something is in the cart, the banner tracks the real cart state; when
  // the cart is empty it previews against the qty selector so the shopper
  // sees the bulk price they'll land on after adding.
  //
  // Supports both shapes the admin form exposes:
  //   1. Multi-tier  → `bulkPricingTiers: [{qty, unitPrice}, ...]`, highest
  //      qty tier the shopper crosses wins. This is the modern default.
  //   2. Legacy flat → `bulkPrice` + `minQuantity` columns. Kept as a
  //      fallback so older products don't suddenly lose their discount.
  // Matches cart.service.ts + orders.service.ts server-side logic 1:1 so
  // the badge the shopper sees here agrees with the price the server
  // actually charges at checkout.
  const effectiveBulkQty = totalProductQty > 0 ? totalProductQty : quantity;
  const bulkTiersRaw = (product as { bulkPricingTiers?: unknown })
    .bulkPricingTiers;
  const bulkTiers: Array<{ qty: number; unitPrice: number }> = Array.isArray(
    bulkTiersRaw,
  )
    ? (bulkTiersRaw as Array<{ qty: unknown; unitPrice: unknown }>)
        .map((t) => ({
          qty: Number(t?.qty),
          unitPrice: Number(t?.unitPrice),
        }))
        .filter((t) => Number.isFinite(t.qty) && Number.isFinite(t.unitPrice))
        .sort((a, b) => b.qty - a.qty)
    : [];
  const applicableTier = bulkTiers.find((t) => effectiveBulkQty >= t.qty);
  const flatBulkPrice = Number(product.bulkPrice) || 0;
  const flatBulkMinQty = Number(product.minQuantity) || 0;

  let bulkPrice = 0;
  let isBulkActive = false;
  if (applicableTier) {
    bulkPrice = applicableTier.unitPrice;
    isBulkActive = true;
  } else if (flatBulkPrice > 0 && flatBulkMinQty > 0) {
    bulkPrice = flatBulkPrice;
    isBulkActive = effectiveBulkQty >= flatBulkMinQty;
  }

  // Effective display price considering bulk
  const displayPrice = isBulkActive
    ? bulkPrice
    : offerResult.hasOffer
      ? offerResult.discountedPrice
      : activePrice;

  const handleAddToCart = () => {
    // Client sends intent only — server re-prices every read, so offer /
    // bulk / currency fields don't need to travel with the add request.
    addToCart.mutate({
      productId: product.id,
      variationId: selectedVariation ? String(selectedVariation.id) : undefined,
      quantity,
      attributes: selectedAttrs,
      userId: user?.id,
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

          {/* Price block.
              Base rule (unchanged): simple products show a single live price,
              no manufactured MRP strikethrough.
              When an offer or bulk tier is actually active, however, we cross
              out the regular price and surface the discounted one so the
              shopper can see what the applied deal did to the price. */}
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-[var(--text-primary)]">
              {format(displayPrice)}
            </span>
            {(isBulkActive || (offerResult.hasOffer && offerResult.discountedPrice < activePrice)) && (
              <>
                <span className="text-lg font-medium text-[var(--text-muted)] line-through">
                  {format(activePrice)}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    isBulkActive
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                  )}
                >
                  {isBulkActive ? "Bulk price applied" : "Offer applied"}
                </span>
              </>
            )}
          </div>

          {/* Offers + Bulk Price.
              Admin forms save the chosen offer onto the Product row as
              `primaryOffer` (via `offerId`), while multi-offer setups also
              populate the `offers[]` many-to-many. Merge both into a single
              list so whichever one the admin used still renders in the
              offer banner. */}
          {(() => {
            const mergedOffers = (() => {
              const seen = new Set<number>();
              const out: NonNullable<typeof product.offers> = [];
              if (product.primaryOffer) {
                seen.add(product.primaryOffer.id);
                out.push(product.primaryOffer);
              }
              for (const o of product.offers ?? []) {
                if (seen.has(o.id)) continue;
                seen.add(o.id);
                out.push(o);
              }
              return out;
            })();
            const hasAnyActiveOffer = mergedOffers.some((o) => o.active);
            const hasBulk =
              parseFloat(product.bulkPrice ?? "0") > 0 &&
              parseInt(product.minQuantity ?? "0", 10) > 0;
            if (!hasAnyActiveOffer && !hasBulk) return null;
            return (
              <OfferList
                offers={mergedOffers}
                bulkPrice={product.bulkPrice}
                minQuantity={product.minQuantity}
                activeQuantity={totalProductQty > 0 ? totalProductQty : quantity}
                claimedOfferIds={(() => {
                  // "Claimed" should only light up when the CURRENT
                  // selection's group is the one getting the offer —
                  // otherwise a Pureweewax / Pack-of-2 combo further
                  // down the cart (that happens to be in offer range)
                  // would make the badge stay green even when this
                  // group has already moved past the tier into bulk.
                  // Match: same productId + same non-Color attrs.
                  const selectedKeys = Object.keys(selectedAttrs).filter(
                    (k) => !offerIgnoreSet.has(k.toLowerCase()),
                  );
                  return (
                    cartItems
                      ?.filter((ci) => {
                        if (ci.productId !== product.id) return false;
                        if (!ci.offerApplied || ci.offerId == null)
                          return false;
                        if (selectedKeys.length === 0) return true;
                        const ciAttrs = (ci.attributes || {}) as Record<
                          string,
                          string
                        >;
                        return selectedKeys.every(
                          (k) => ciAttrs[k] === selectedAttrs[k],
                        );
                      })
                      .map((ci) => ci.offerId as number) ?? []
                  );
                })()}
                bulkApplied={isBulkActive}
              />
            );
          })()}

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
                hideUnavailable={hideUnavailableVariations}
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

          {/* Desktop: Quantity + Add to Cart OR Increment/Decrement.
              Flex (not grid) so the stepper keeps its intrinsic width — when
              it was forced to `w-full` the visible background stretched far
              beyond the actual <button> hit-area and clicks near the edge
              just landed on the wrapper div. */}
          <div className="hidden lg:flex lg:items-stretch lg:gap-3">
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
                />
                <div className="flex flex-1 items-center justify-center rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 text-sm font-medium text-[var(--text-secondary)]">
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
                />
                <button
                  onClick={handleAddToCart}
                  disabled={addToCart.isPending || activeStock === 0}
                  className="flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-[var(--accent-primary)] px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[var(--accent-primary-hover)] disabled:pointer-events-none disabled:opacity-50"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </button>
              </>
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

      {/* Tabs: Description / Product Details / Reviews & Rating
          (long description lives inside the Description tab below) */}
      <ProductTabs product={product} selectedVariation={selectedVariation} />

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
