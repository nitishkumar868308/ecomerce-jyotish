import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CountryState {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  exchangeRate: number;
  setCountry: (country: { code: string; name: string; currency: string; symbol: string; exchangeRate: number }) => void;
}

export const useCountryStore = create<CountryState>()(
  persist(
    (set) => ({
      code: "IND",
      name: "India",
      currency: "INR",
      symbol: "₹",
      exchangeRate: 1,
      setCountry: (country) => {
        localStorage.setItem("selectedCountry", country.code);
        set(country);
      },
    }),
    {
      name: "country-storage",
    }
  )
);
