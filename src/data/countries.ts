export interface Country {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: "IND", name: "India", currency: "INR", symbol: "₹", flag: "🇮🇳" },
  { code: "USA", name: "United States", currency: "USD", symbol: "$", flag: "🇺🇸" },
  { code: "GBR", name: "United Kingdom", currency: "GBP", symbol: "£", flag: "🇬🇧" },
  { code: "EUR", name: "Europe", currency: "EUR", symbol: "€", flag: "🇪🇺" },
  { code: "AUS", name: "Australia", currency: "AUD", symbol: "A$", flag: "🇦🇺" },
  { code: "CAN", name: "Canada", currency: "CAD", symbol: "C$", flag: "🇨🇦" },
  { code: "SGP", name: "Singapore", currency: "SGD", symbol: "S$", flag: "🇸🇬" },
  { code: "ARE", name: "UAE", currency: "AED", symbol: "د.إ", flag: "🇦🇪" },
  { code: "SAU", name: "Saudi Arabia", currency: "SAR", symbol: "﷼", flag: "🇸🇦" },
  { code: "MYS", name: "Malaysia", currency: "MYR", symbol: "RM", flag: "🇲🇾" },
];
