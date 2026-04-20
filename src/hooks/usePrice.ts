"use client";

import { useCallback } from "react";
import { useCountryStore } from "@/stores/useCountryStore";

export interface UsePriceReturn {
  symbol: string;
  currency: string;
  code: string;
  convert: (inr: number | string | null | undefined) => number;
  format: (inr: number | string | null | undefined) => string;
}

const toNumber = (value: number | string | null | undefined): number => {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

export function usePrice(): UsePriceReturn {
  const symbol = useCountryStore((s) => s.symbol);
  const currency = useCountryStore((s) => s.currency);
  const code = useCountryStore((s) => s.code);
  const conversionRate = useCountryStore((s) => s.conversionRate);
  const multiplier = useCountryStore((s) => s.multiplier);

  const convert = useCallback(
    (inr: number | string | null | undefined) => {
      const base = toNumber(inr);
      const rate = conversionRate || 1;
      const mult = multiplier || 1;
      const value = base * rate * mult;
      return Math.round(value * 100) / 100;
    },
    [conversionRate, multiplier]
  );

  const format = useCallback(
    (inr: number | string | null | undefined) => {
      const value = convert(inr);
      return `${symbol}${value.toLocaleString(undefined, {
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [convert, symbol]
  );

  return { symbol, currency, code, convert, format };
}
