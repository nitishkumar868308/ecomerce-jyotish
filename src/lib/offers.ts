import type { Offer, Product } from "@/types/product";

export interface OfferResult {
  hasOffer: boolean;
  /** Effective per-unit price once the offer is applied. */
  discountedPrice: number;
  /** Total absolute discount for one unit (money). */
  discountAmount: number;
  /** Short human label used in price displays, e.g. "15% OFF". */
  discountLabel: string;
  /** Long form, used in offer list tiles, e.g. "Buy 5+, get 15% off". */
  offerHeadline: string;
  /** Number of free units the offer would grant at the given quantity. */
  freeItems: number;
  offer: Offer | null;
}

/** Raw `discountValue` shape is JSON — these helpers pluck numeric fields safely. */
function pickNum(bag: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = bag[k];
    const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/**
 * Given a per-unit price + offer + quantity in cart, figure out what the buyer
 * actually pays and what headline label to show.
 *
 * Supported discountTypes (matches backend CreateOfferDto):
 *   - "PERCENTAGE" → discountValue = { minQty, percent }
 *   - "RANGE_FREE" → discountValue = { from, to, freeCount }
 *   - Legacy "FLAT" / "FIXED" / "AMOUNT" → discountValue = { value }
 *
 * Quantity-gated offers (PERCENTAGE with minQty, RANGE_FREE) only fire when
 * the quantity is in range. Below the trigger we still return the offer so
 * the UI can show the "Buy X more to unlock" hint, but `hasOffer` stays
 * false so price displays don't lie.
 */
export function calculateOffer(
  price: number,
  offer: Offer | null | undefined,
  quantity = 1,
): OfferResult {
  const empty: OfferResult = {
    hasOffer: false,
    discountedPrice: price,
    discountAmount: 0,
    discountLabel: "",
    offerHeadline: "",
    freeItems: 0,
    offer: null,
  };

  if (!offer || !offer.active || offer.deleted) return empty;

  const bag =
    typeof offer.discountValue === "object" && offer.discountValue
      ? (offer.discountValue as Record<string, unknown>)
      : {};
  const type = offer.discountType?.toUpperCase() ?? "";

  if (type === "PERCENTAGE" || type === "PERCENT") {
    const percent = pickNum(bag, "percent", "value", "amount");
    const minQty = pickNum(bag, "minQty", "minQuantity", "qty");
    const headline =
      minQty > 1
        ? `Buy ${minQty}+ and get ${percent}% off`
        : `${percent}% off on this product`;
    if (percent <= 0) return { ...empty, offer, offerHeadline: headline };

    const unlocked = minQty <= 1 || quantity >= minQty;
    if (!unlocked) {
      return { ...empty, offer, offerHeadline: headline };
    }
    const discountAmount = (price * percent) / 100;
    return {
      hasOffer: discountAmount > 0,
      discountedPrice: Math.max(0, price - discountAmount),
      discountAmount,
      discountLabel: `${percent}% OFF`,
      offerHeadline: headline,
      freeItems: 0,
      offer,
    };
  }

  if (type === "RANGE_FREE") {
    const from = pickNum(bag, "from", "minQty", "start");
    const to = pickNum(bag, "to", "maxQty", "end");
    const freeCount = pickNum(bag, "freeCount", "free", "count");
    const headline =
      from && to
        ? `Buy ${from}-${to} items and get ${freeCount} free`
        : `Buy ${from || "?"}+ items and get ${freeCount} free`;

    const inRange =
      quantity >= from && (to ? quantity <= to : true) && freeCount > 0;
    if (!inRange) {
      return { ...empty, offer, offerHeadline: headline };
    }
    // Free-items offers leave the unit price alone but the cart total
    // effectively pays for (quantity) and ships (quantity + freeCount).
    return {
      hasOffer: true,
      discountedPrice: price,
      discountAmount: 0,
      discountLabel: `+${freeCount} FREE`,
      offerHeadline: headline,
      freeItems: freeCount,
      offer,
    };
  }

  if (type === "FLAT" || type === "FIXED" || type === "AMOUNT") {
    const value = pickNum(bag, "value", "amount");
    if (value <= 0) return { ...empty, offer };
    const discountAmount = Math.min(value, price);
    return {
      hasOffer: discountAmount > 0,
      discountedPrice: Math.max(0, price - discountAmount),
      discountAmount,
      discountLabel: `\u20b9${value} OFF`,
      offerHeadline: `Flat \u20b9${value} off`,
      freeItems: 0,
      offer,
    };
  }

  return { ...empty, offer };
}

export function getProductOfferPrice(product: Product): {
  finalPrice: number;
  originalPrice: number;
  offerResult: OfferResult;
  hasBulkPrice: boolean;
  bulkPrice: number;
  bulkMinQty: number;
} {
  const price = Number(product.price) || 0;
  const mrp = Number(product.MRP) || price;

  const primaryOffer = product.primaryOffer || product.offers?.[0] || null;
  const offerResult = calculateOffer(price, primaryOffer);

  const hasBulkPrice = !!(product.bulkPrice && product.minQuantity);
  const bulkPrice = Number(product.bulkPrice) || 0;
  const bulkMinQty = Number(product.minQuantity) || 0;

  return {
    finalPrice: offerResult.discountedPrice,
    originalPrice: mrp > price ? mrp : price,
    offerResult,
    hasBulkPrice,
    bulkPrice,
    bulkMinQty,
  };
}

/**
 * Build a human-facing headline for an offer even when we don't know the
 * current cart quantity — used by offer badges on listing cards.
 */
export function describeOffer(offer: Offer | null | undefined): string {
  if (!offer) return "";
  return calculateOffer(0, offer, 0).offerHeadline;
}
