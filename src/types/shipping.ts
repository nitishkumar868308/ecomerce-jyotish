export interface ShippingPrice {
  id: number;
  countryCode: string;
  countryName: string;
  basePrice: number;
  perKgPrice: number;
  freeShippingAbove?: number;
  estimatedDays: string;
  isActive: boolean;
  createdAt: string;
}

export interface CountryPrice {
  id: number;
  countryCode: string;
  countryName: string;
  currency: string;
  symbol: string;
  exchangeRate: number;
  isActive: boolean;
  createdAt: string;
}

export interface CountryTax {
  id: number;
  countryCode: string;
  countryName: string;
  taxRate: number;
  taxName: string;
  isActive: boolean;
  createdAt: string;
}
