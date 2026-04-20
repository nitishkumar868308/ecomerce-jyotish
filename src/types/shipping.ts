/**
 * Backend `ShippingPricing` row.
 * `type` is one of "AIR" | "ROAD" (enforced via the admin UI dropdown).
 * Prices are stored in INR — they are converted to the user's currency at
 * display/checkout time via the country-pricing multiplier chain.
 */
export type ShippingMode = "AIR" | "ROAD";

export interface ShippingPrice {
  id: string;
  name: string;
  code: string;
  country: string;
  currency: string;
  currencySymbol: string;
  price: number;
  type: ShippingMode | string;
  description?: string | null;
  active: boolean;
  deleted?: boolean;
  createdAt?: string;
}

/**
 * Backend `CountryPricing` row.
 * Price resolution: `finalPrice = priceINR × (conversionRate ?? 1) × multiplier`.
 */
export interface CountryPrice {
  id: number;
  country: string;
  code: string;
  currency: string;
  currencySymbol: string;
  conversionRate?: number | null;
  multiplier: number;
  active: boolean;
  deleted?: number;
  createdAt?: string;
}

export interface CountryTax {
  id: number;
  countryCode?: string;
  countryName?: string;
  country?: string;
  categoryId?: number;
  categoryName?: string;
  taxPercent?: number;
  gstPercent?: number;
  taxRate?: number;
  taxName?: string;
  isActive?: boolean;
  active?: boolean;
  createdAt: string;
  updatedAt?: string;
}
