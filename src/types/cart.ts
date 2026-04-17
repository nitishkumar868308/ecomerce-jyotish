export interface CartItem {
  id: string;
  productId: string;
  variationId?: string;
  productName: string;
  quantity: number;
  pricePerItem: number;
  currencySymbol: string;
  totalPrice: number;
  attributes: Record<string, unknown>;
  image?: string;
  userId?: number;
  selectedCountry?: string;
  currency?: string;
  is_buy: boolean;
  bulkMinQty?: number;
  bulkPrice?: number;
  offerApplied?: boolean;
  productOfferApplied?: boolean;
  productOfferDiscount?: number;
  productOffer?: Record<string, unknown>;
  productOfferId?: number;
  barCode?: string;
  purchasePlatform: string;
  createdAt: string;
  updatedAt: string;

  // Enriched fields from backend offer/bulk calculation
  effectivePrice?: number;
  bulkApplied?: boolean;
  isFreeItem?: boolean;
  freeQtyInThisItem?: number;
  paidQty?: number;
  offerSummary?: {
    offerName: string;
    totalQty: number;
    freeQty: number;
    claimed: boolean;
    offerId: number;
    start: number;
    end: number;
  } | null;
}

export interface AddToCartPayload {
  productId: string;
  variationId?: string;
  productName: string;
  quantity: number;
  pricePerItem: number;
  currencySymbol: string;
  totalPrice: number;
  attributes: Record<string, unknown>;
  image?: string;
  userId?: number;
  selectedCountry?: string;
  currency?: string;
  barCode?: string;
  bulkPrice?: number;
  bulkMinQty?: number;
  offerApplied?: boolean;
  productOfferApplied?: boolean;
  productOfferDiscount?: number;
  productOffer?: Record<string, unknown>;
  productOfferId?: number;
  purchasePlatform?: string;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}
