import type { CountryPrice } from "@/types/shipping";

export interface PriceResolveResult {
  /** Final amount shown to the user. */
  amount: number;
  /** Amount rounded to 2 decimals as a string (what UI will render). */
  formatted: string;
  /** Currency symbol from country-pricing (falls back to ₹). */
  symbol: string;
  /** Currency code (e.g. "USD", "INR"). */
  currency: string;
}

/**
 * Core formula: `priceINR × (conversionRate ?? 1) × multiplier`.
 *
 * `multiplier` is the admin's pricing lever (e.g. 1.2× markup). `conversionRate`
 * converts INR to the destination currency. Both live on the CountryPrice row.
 */
export function resolveProductPrice(
  priceINR: number | string | null | undefined,
  countryPricing: CountryPrice | null | undefined,
): PriceResolveResult {
  const base = typeof priceINR === "string" ? parseFloat(priceINR) : priceINR;
  const safe = Number.isFinite(base) ? (base as number) : 0;
  if (!countryPricing) {
    return {
      amount: safe,
      formatted: safe.toFixed(2),
      symbol: "₹",
      currency: "INR",
    };
  }
  const rate = countryPricing.conversionRate ?? 1;
  const final = safe * rate * (countryPricing.multiplier || 1);
  return {
    amount: final,
    formatted: final.toFixed(2),
    symbol: countryPricing.currencySymbol || "₹",
    currency: countryPricing.currency || "INR",
  };
}

/**
 * Given a bulk pricing table and a user quantity, pick the winning tier.
 * Tiers `{qty, unitPrice}` are inclusive thresholds (qty ≥ T → that tier).
 * Returns null when no tier applies; caller then falls back to offer/regular.
 */
export function pickBulkTier(
  qty: number,
  tiers:
    | Array<{ qty: number; unitPrice: number }>
    | null
    | undefined,
): { qty: number; unitPrice: number } | null {
  if (!tiers || tiers.length === 0) return null;
  const sorted = [...tiers].sort((a, b) => a.qty - b.qty);
  let winner: { qty: number; unitPrice: number } | null = null;
  for (const tier of sorted) {
    if (qty >= tier.qty) winner = tier;
  }
  return winner;
}

/**
 * Offer math — branches on discountType shape (see backend
 * `CreateOfferDto` docs). Supplied `qty` and `unitPrice` should be in INR.
 *
 *   RANGE_FREE  →  from ≤ qty ≤ to ⇒ `freeCount` items don't charge.
 *                  Implementation: returned `chargedQty = qty - freeCount`.
 *   PERCENTAGE  →  qty ≥ minQty ⇒ `percent`% off every unit.
 *
 * Returns `null` when the offer doesn't apply to this quantity.
 */
export function applyOffer(
  qty: number,
  unitPrice: number,
  offer:
    | {
        discountType: string;
        discountValue:
          | { from?: number; to?: number; freeCount?: number }
          | { minQty?: number; percent?: number }
          | null
          | undefined;
      }
    | null
    | undefined,
): { chargedQty: number; unitPrice: number; freeQty: number } | null {
  if (!offer?.discountType || !offer?.discountValue) return null;
  const d = offer.discountValue as Record<string, number | undefined>;
  if (offer.discountType === "RANGE_FREE") {
    const { from = 0, to = 0, freeCount = 0 } = d;
    if (qty < from || qty > to) return null;
    return { chargedQty: Math.max(0, qty - freeCount), unitPrice, freeQty: freeCount };
  }
  if (offer.discountType === "PERCENTAGE") {
    const { minQty = 0, percent = 0 } = d;
    if (qty < minQty) return null;
    const discounted = unitPrice * (1 - percent / 100);
    return { chargedQty: qty, unitPrice: discounted, freeQty: 0 };
  }
  return null;
}

/**
 * Checkout precedence per spec:
 *   qty inside offer range → offer wins.
 *   qty crosses bulk tier threshold → bulk wins (and offer stops).
 *   otherwise → regular unit price × qty.
 *
 * Returns a line-item total plus trace fields so the UI can explain the math.
 */
export function resolveCartLine(opts: {
  qty: number;
  unitPriceINR: number;
  offer?: Parameters<typeof applyOffer>[2];
  bulkTiers?: Parameters<typeof pickBulkTier>[1];
}): {
  totalINR: number;
  appliedRule: "bulk" | "offer" | "regular";
  chargedQty: number;
  effectiveUnit: number;
  freeQty: number;
} {
  const { qty, unitPriceINR, offer, bulkTiers } = opts;

  const bulk = pickBulkTier(qty, bulkTiers);
  if (bulk) {
    return {
      appliedRule: "bulk",
      chargedQty: qty,
      effectiveUnit: bulk.unitPrice,
      freeQty: 0,
      totalINR: qty * bulk.unitPrice,
    };
  }

  const offerResult = applyOffer(qty, unitPriceINR, offer);
  if (offerResult) {
    return {
      appliedRule: "offer",
      chargedQty: offerResult.chargedQty,
      effectiveUnit: offerResult.unitPrice,
      freeQty: offerResult.freeQty,
      totalINR: offerResult.chargedQty * offerResult.unitPrice,
    };
  }

  return {
    appliedRule: "regular",
    chargedQty: qty,
    effectiveUnit: unitPriceINR,
    freeQty: 0,
    totalINR: qty * unitPriceINR,
  };
}
