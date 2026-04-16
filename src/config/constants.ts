export const APP_NAME = "Hecate Wizard Mall";
export const APP_DESCRIPTION = "Premium E-Commerce Store";

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  ADMIN_LIMIT: 20,
  OPTIONS: [10, 20, 50, 100],
} as const;

export const IMAGE_SIZES = {
  THUMBNAIL: { width: 200, height: 200 },
  CARD: { width: 400, height: 400 },
  DETAIL: { width: 800, height: 800 },
  BANNER: { width: 1920, height: 600 },
} as const;

export const DEFAULT_COUNTRY = "IND";
export const DEFAULT_CURRENCY = "INR";
export const DEFAULT_CURRENCY_SYMBOL = "₹";
