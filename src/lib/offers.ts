import type { Offer, Product } from "@/types/product";

export interface OfferResult {
  hasOffer: boolean;
  discountedPrice: number;
  discountAmount: number;
  discountLabel: string;
  offer: Offer | null;
}

export function calculateOffer(
  price: number,
  offer: Offer | null | undefined
): OfferResult {
  if (!offer || !offer.active || offer.deleted) {
    return {
      hasOffer: false,
      discountedPrice: price,
      discountAmount: 0,
      discountLabel: "",
      offer: null,
    };
  }

  const discountValue =
    typeof offer.discountValue === "object" && offer.discountValue
      ? (offer.discountValue as Record<string, unknown>)
      : {};

  const value = Number(discountValue.value || discountValue.amount || 0);
  const type = offer.discountType?.toUpperCase() || "";

  let discountedPrice = price;
  let discountAmount = 0;
  let discountLabel = "";

  if (type === "PERCENTAGE" || type === "PERCENT") {
    discountAmount = (price * value) / 100;
    discountedPrice = price - discountAmount;
    discountLabel = `${value}% OFF`;
  } else if (type === "FLAT" || type === "FIXED" || type === "AMOUNT") {
    discountAmount = Math.min(value, price);
    discountedPrice = price - discountAmount;
    discountLabel = `₹${value} OFF`;
  }

  discountedPrice = Math.max(0, discountedPrice);

  return {
    hasOffer: discountAmount > 0,
    discountedPrice,
    discountAmount,
    discountLabel,
    offer,
  };
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
