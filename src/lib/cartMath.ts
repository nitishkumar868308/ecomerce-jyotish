import type { CartItem } from "@/types/cart";
import type { Offer, Product, ProductVariation } from "@/types/product";
import { calculateOffer } from "@/lib/offers";

// Computes per-line and cart-level money math for a shopper's basket —
// shared between ProductDetail, CartDrawer and Checkout so all three stay in
// sync when a line is incremented, decremented or removed.
//
// Two discount types are layered:
//   1. Bulk pricing (product-level `bulkPrice` + `minQuantity`). When the
//      total qty across all variations of a product crosses the threshold,
//      every paid unit falls to `bulkPrice`. While bulk is active, product
//      offers are suppressed — there's no "buy 12, get 2 free" tax *on top
//      of* the bulk discount.
//   2. Product offers via `primaryOffer` / `offers[]`. RANGE_FREE grants N
//      free units once qty is inside [from, to]; PERCENTAGE shaves the
//      price per unit; FLAT knocks a fixed amount off per unit.
//
// "Which units are free?" — for RANGE_FREE the shopper keeps the cheapest
// ones and the N most expensive units (ties broken by most-recently-added)
// become the freebies. That matches the storefront promise ("tum saste wale
// pay karte ho, baaki free") and what the UI needs to label.

export interface EnrichedCartItem extends CartItem {
  /** Units the shopper actually pays for in this line. */
  paidQty: number;
  /** Units granted for free by a RANGE_FREE offer in this line. */
  freeQty: number;
  /** Per-unit MRP (or base price when no MRP). */
  originalUnitPrice: number;
  /** Per-unit charge after offer / bulk applied. */
  effectiveUnitPrice: number;
  /** totalQty * originalUnitPrice — what the shopper would pay with no offer. */
  lineOriginal: number;
  /** (paidQty * effective) — what the shopper actually pays. */
  lineFinal: number;
  /** Savings on this single line. */
  lineSavings: number;
  /** Bulk pricing is in effect for this line. */
  bulkApplied: boolean;
  /** Populated when this line received free units from an offer. */
  offerSummary?: {
    offerId: number;
    offerName: string;
    freeQty: number;
    /** Legacy UI fields — some views expect these on the offer summary. */
    totalQty?: number;
    claimed?: boolean;
    start?: number;
    end?: number;
  };
  // ── Legacy aliases kept for existing call sites ────────────────────
  /** Same as effectiveUnitPrice. Legacy field populated by useCartSummary. */
  effectivePrice?: number;
  /** Same as freeQty. Legacy field populated by useCartSummary. */
  freeQtyInThisItem?: number;
  /** True when every unit in this line is free. */
  isFreeItem?: boolean;
  /** Same as lineFinal. Legacy field populated by useCartSummary. */
  totalPrice?: number;
}

export interface ProductGroupSummary {
  /**
   * Stable unique identifier for the group = `productId::non-ignored-attrs`.
   * Use this as the React key — `productId` alone can collide when the
   * same product has multiple groups (different non-ignored attribute
   * combos like wax-type / form-size).
   */
  groupKey: string;
  productId: string;
  productName: string;
  items: EnrichedCartItem[];
  totalQty: number;
  paidQty: number;
  freeQty: number;
  bulkApplied: boolean;
  appliedOffer?: Offer;
  groupOriginal: number;
  groupFinal: number;
  groupSavings: number;
}

export interface CartMoneySummary {
  enriched: EnrichedCartItem[];
  groups: ProductGroupSummary[];
  subtotalOriginal: number;
  subtotalFinal: number;
  totalSavings: number;
  totalQty: number;
  /** Units marked as free across the entire cart — useful for a headline
   *  like "2 items free on this order". */
  totalFreeQty: number;
}

/**
 * Minimal read of what the cart-math needs from a product. Callers can pass
 * a full `Product` (it's a superset) or a slim snapshot from a listing.
 */
export interface CartProductInfo {
  id: string;
  name: string;
  price?: string | number | null;
  MRP?: string | number | null;
  bulkPrice?: string | number | null;
  minQuantity?: string | number | null;
  primaryOffer?: Offer | null;
  offers?: Offer[] | null;
  variations?: ProductVariation[] | null;
}

function toNum(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function pickOffer(product: CartProductInfo): Offer | null {
  if (product.primaryOffer && product.primaryOffer.active) {
    return product.primaryOffer;
  }
  const active = (product.offers ?? []).find((o) => o.active && !o.deleted);
  return active ?? null;
}

/**
 * Resolve the per-unit price a cart line should charge *before* any
 * offer/bulk math. Honours variation price when present, otherwise the
 * product price. Falls back to the price the line was saved at so we never
 * regress a paid total just because the product wasn't loaded.
 */
function resolveUnitPrice(
  item: CartItem,
  product: CartProductInfo | undefined,
): { price: number } {
  // MRP comparisons were removed storefront-wide. Only the live price is
  // used, so "original" amounts surface exactly the savings from offers and
  // bulk tiers — never a manufactured MRP-vs-price gap.
  const variation = product?.variations?.find(
    (v) => String(v.id) === String(item.variationId ?? ""),
  );
  const price =
    toNum(variation?.price) ||
    toNum(product?.price) ||
    toNum(item.pricePerItem);
  return { price };
}

/**
 * Build an enriched view of the cart. Groups cart rows by productId, applies
 * offer + bulk math per group, and returns per-line + cart-level totals.
 *
 * The `products` map is keyed by product id. Callers typically build it from
 * the list response they already have on the page. Rows whose product is
 * missing still get conservative math (no offer / bulk, uses the stored
 * line price) so the cart stays renderable even while products are loading.
 */
export function computeCartSummary(
  items: CartItem[],
  products: Record<string, CartProductInfo | undefined>,
): CartMoneySummary {
  if (!items.length) {
    return {
      enriched: [],
      groups: [],
      subtotalOriginal: 0,
      subtotalFinal: 0,
      totalSavings: 0,
      totalQty: 0,
      totalFreeQty: 0,
    };
  }

  // Group rows by productId; offers + bulk are defined per-product.
  const byProduct = new Map<string, CartItem[]>();
  for (const item of items) {
    const list = byProduct.get(item.productId) ?? [];
    list.push(item);
    byProduct.set(item.productId, list);
  }

  const allEnriched: EnrichedCartItem[] = [];
  const groups: ProductGroupSummary[] = [];

  for (const [productId, rows] of byProduct) {
    const product = products[productId];
    const totalQty = rows.reduce((sum, r) => sum + r.quantity, 0);
    // Bulk pricing can come from either the product fetch OR the cart row
    // itself — the storefront stashes `bulkPrice` + `bulkMinQty` on the
    // cart line at add-to-cart time, so even if the product query is still
    // loading (or the API omits those columns) we can still apply bulk
    // from the row-level fallback.
    const rowBulkPrice = rows.reduce((acc, r) => {
      const v = toNum((r as { bulkPrice?: unknown }).bulkPrice);
      return v > 0 ? v : acc;
    }, 0);
    const rowBulkMinQty = rows.reduce((acc, r) => {
      const v = toNum((r as { bulkMinQty?: unknown }).bulkMinQty);
      return v > 0 ? v : acc;
    }, 0);
    const bulkPrice = toNum(product?.bulkPrice) || rowBulkPrice;
    const bulkMinQty = toNum(product?.minQuantity) || rowBulkMinQty;
    const bulkApplied =
      bulkPrice > 0 && bulkMinQty > 0 && totalQty >= bulkMinQty;
    const offer = bulkApplied ? null : pickOffer(product ?? ({} as CartProductInfo));

    // Figure out how many units the offer grants free for this quantity.
    let offerFreeUnits = 0;
    if (offer) {
      const offerResult = calculateOffer(0, offer, totalQty);
      offerFreeUnits = offerResult.freeItems || 0;
    }

    // Per-line initial prices + free allocation ordering.
    // Allocate `offerFreeUnits` starting from the MOST EXPENSIVE row so the
    // shopper keeps the cheap ones paid; on ties, the most-recently-added
    // line wins — mirrors the brief.
    const rowInfos = rows.map((row, idx) => {
      const { price } = resolveUnitPrice(row, product);
      const addedAt = Date.parse(row.createdAt || row.updatedAt || "") || idx;
      return { row, price, addedAt };
    });

    // Allocation index: [rowIndex -> freeQty]
    const freeAlloc = new Array<number>(rowInfos.length).fill(0);
    if (offerFreeUnits > 0) {
      const order = rowInfos
        .map((info, idx) => ({ ...info, idx }))
        .sort((a, b) => {
          if (b.price !== a.price) return b.price - a.price;
          return b.addedAt - a.addedAt;
        });

      let remaining = offerFreeUnits;
      for (const candidate of order) {
        if (remaining <= 0) break;
        const take = Math.min(candidate.row.quantity, remaining);
        freeAlloc[candidate.idx] = take;
        remaining -= take;
      }
    }

    const enrichedRows: EnrichedCartItem[] = rowInfos.map((info, idx) => {
      const paidQty = Math.max(0, info.row.quantity - freeAlloc[idx]);
      const freeQty = freeAlloc[idx];

      let effective = info.price;
      if (bulkApplied) {
        effective = bulkPrice;
      } else if (offer) {
        // RANGE_FREE leaves price untouched (free math above); PERCENTAGE /
        // FLAT drop the per-unit price via calculateOffer.
        const perUnit = calculateOffer(info.price, offer, totalQty);
        if (perUnit.hasOffer && perUnit.discountedPrice < info.price) {
          effective = perUnit.discountedPrice;
        }
      }

      // "Original" now means "price × qty if no offer/bulk were applied".
      // Savings surface exactly what the offer or bulk tier reduced — never
      // a synthetic MRP-vs-price gap.
      const lineOriginal = info.price * info.row.quantity;
      const lineFinal = effective * paidQty;
      const lineSavings = Math.max(0, lineOriginal - lineFinal);

      return {
        ...info.row,
        paidQty,
        freeQty,
        originalUnitPrice: info.price,
        effectiveUnitPrice: effective,
        lineOriginal,
        lineFinal,
        lineSavings,
        bulkApplied,
        offerSummary:
          freeQty > 0 && offer
            ? {
                offerId: offer.id,
                offerName: offer.name,
                freeQty,
              }
            : undefined,
      };
    });

    const groupOriginal = enrichedRows.reduce((s, r) => s + r.lineOriginal, 0);
    const groupFinal = enrichedRows.reduce((s, r) => s + r.lineFinal, 0);
    const paidQty = enrichedRows.reduce((s, r) => s + r.paidQty, 0);
    const freeQty = enrichedRows.reduce((s, r) => s + r.freeQty, 0);

    groups.push({
      groupKey: productId,
      productId,
      productName: product?.name ?? rows[0]?.productName ?? "Product",
      items: enrichedRows,
      totalQty,
      paidQty,
      freeQty,
      bulkApplied,
      appliedOffer: offer ?? undefined,
      groupOriginal,
      groupFinal,
      groupSavings: Math.max(0, groupOriginal - groupFinal),
    });
    allEnriched.push(...enrichedRows);
  }

  const subtotalOriginal = groups.reduce((s, g) => s + g.groupOriginal, 0);
  const subtotalFinal = groups.reduce((s, g) => s + g.groupFinal, 0);
  const totalQty = groups.reduce((s, g) => s + g.totalQty, 0);
  const totalFreeQty = groups.reduce((s, g) => s + g.freeQty, 0);

  return {
    enriched: allEnriched,
    groups,
    subtotalOriginal,
    subtotalFinal,
    totalSavings: Math.max(0, subtotalOriginal - subtotalFinal),
    totalQty,
    totalFreeQty,
  };
}
