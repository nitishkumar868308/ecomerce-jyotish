export interface CountryPricing {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  rate: number;
}

export function convertPrice(priceINR: number, rate: number): number {
  return Math.round(priceINR * rate * 100) / 100;
}

export function formatConvertedPrice(
  priceINR: number,
  pricing: CountryPricing
): string {
  const converted = convertPrice(priceINR, pricing.rate);
  return `${pricing.symbol}${converted.toLocaleString()}`;
}
