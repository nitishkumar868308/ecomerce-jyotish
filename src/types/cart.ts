/**
 * Cart is now compute-on-read: the server fetches the user's raw cart
 * rows, joins fresh Product/Offer/BulkPricing data, groups by the product's
 * `offerIgnoreAttributes`, distributes free units across lines, applies
 * country currency conversion, and returns the fully-priced view. Clients
 * only display — never compute pricing — so the shopper can't tamper with
 * totals by editing localStorage or React state.
 */

export interface CartItem {
  id: string;
  productId: string;
  variationId: string | null;
  productName: string;
  variationName: string | null;
  image: string | null;
  sku: string | null;
  barCode: string | null;
  attributes: Record<string, string>;

  quantity: number;
  paidQty: number;
  freeQty: number;

  /** Per-unit price before any offer / bulk, in the viewer's currency. */
  originalPrice: number;
  /** Per-unit price after bulk (offer frees are expressed via freeQty). */
  pricePerItem: number;
  /** Total for this line after bulk + free units are applied. */
  lineTotal: number;
  /** Amount the shopper saved on this line vs. originalPrice × quantity. */
  savedAmount: number;

  bulkApplied: boolean;
  bulkMinQty: number | null;
  bulkPrice: number | null;

  offerApplied: boolean;
  offerId: number | null;
  offerName: string | null;

  /** productId + non-ignored attributes. Shared across variations that form
   *  a single offer/bulk group (e.g. same product, different colours when
   *  Color is in offerIgnoreAttributes). */
  groupKey: string;

  currency: string;
  currencySymbol: string;
  purchasePlatform: string;
  is_buy?: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface CartGroup {
  groupKey: string;
  productId: string;
  productName: string;
  totalQty: number;
  freeQty: number;
  savedAmount: number;
  offerApplied: boolean;
  offerId: number | null;
  offerName: string | null;
  offerProgress: {
    start: number;
    end: number;
    currentQty: number;
    reached: boolean;
    freeAvailable: number;
  } | null;
  bulkApplied: boolean;
  bulkMinQty: number | null;
  bulkPrice: number | null;
  itemIds: string[];
}

export interface CartResponse {
  items: CartItem[];
  groups: CartGroup[];
  summary: {
    subtotal: number;
    discount: number;
    total: number;
    currency: string;
    currencySymbol: string;
    itemCount: number;
  };
}

/** Minimal payload for add-to-cart — client sends intent only, server prices. */
export interface AddToCartPayload {
  productId: string;
  variationId?: string;
  quantity: number;
  attributes: Record<string, string>;
  userId?: number;
  purchasePlatform?: string;
}
