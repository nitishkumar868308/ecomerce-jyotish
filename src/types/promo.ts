export type PromoDiscountType = "PERCENTAGE" | "FLAT";
export type PromoTargetType = "ALL" | "USER";

export interface PromoCode {
  id: number;
  code: string;
  description?: string;
  discountType: PromoDiscountType;
  discountValue: number;
  /** Legacy alias used by the backend for percent-only promos. */
  discountPercent?: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  targetType?: PromoTargetType;
  userId?: number | null;
  userIds?: number[];
  /** Total times the promo can be used across the platform. */
  maxUses?: number;
  /** Times any single user may redeem this promo. */
  perUserLimit?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface PromoUsage {
  id: number;
  promoCodeId: number;
  promoCode?: string;
  userId: number;
  userName?: string;
  userEmail?: string;
  orderId?: number | string;
  amountBefore: number;
  amountAfter: number;
  discountAmount: number;
  usedAt: string;
}
