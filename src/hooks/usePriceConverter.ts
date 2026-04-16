import { useCountryStore } from "@/stores/useCountryStore";
import { convertPrice } from "@/lib/price-converter";

export function usePriceConverter() {
  const { symbol, exchangeRate, currency } = useCountryStore();

  const convert = (priceINR: number): number => {
    return convertPrice(priceINR, exchangeRate);
  };

  const format = (priceINR: number): string => {
    const converted = convert(priceINR);
    return `${symbol}${converted.toLocaleString()}`;
  };

  return { convert, format, symbol, currency };
}
