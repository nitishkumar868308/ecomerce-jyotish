"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CountryPayload {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  conversionRate: number;
  multiplier: number;
}

interface CountryState extends CountryPayload {
  /** Back-compat alias for existing consumers that still read `exchangeRate`. */
  exchangeRate: number;
  setCountry: (country: CountryPayload) => void;
}

const DEFAULT_COUNTRY: CountryPayload = {
  code: "IND",
  name: "India",
  currency: "INR",
  symbol: "₹",
  conversionRate: 1,
  multiplier: 1,
};

export const useCountryStore = create<CountryState>()(
  persist(
    (set) => ({
      ...DEFAULT_COUNTRY,
      exchangeRate: 1,
      setCountry: (country) => {
        set({ ...country, exchangeRate: country.conversionRate });
        if (typeof window !== "undefined") {
          localStorage.setItem("selectedCountry", country.code);
        }
      },
    }),
    { name: "country-storage" }
  )
);
