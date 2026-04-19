import axios from "axios";

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  CLOUDINARY_URL: process.env.NEXT_PUBLIC_CLOUDINARY_URL || "",
  CLOUDINARY_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "",
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
} as const;

export const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach auth token & country
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const country = localStorage.getItem("selectedCountry") || "IND";
    config.headers["x-country"] = country;
  }
  return config;
});

// Response interceptor - handle 401, transform errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Redirect to home - auth store will handle the rest
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
    }
    return Promise.reject(error);
  }
);

// API endpoint paths
export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    GOOGLE: "/auth/google",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    GET_ALL_USERS: "/auth/getAllUser",
    UPDATE_USER: "/auth/updateUser",
    DELETE_USER: (id: number) => `/auth/users/${id}`,
  },
  PRODUCTS: {
    LIST: "/products",
    FAST: "/products/fast",
    ALL: "/products/all",
    SINGLE: (id: string | number) => `/products/${id}`,
    CHECK_SKU: "/products/check-sku",
    MASTER: "/masterProducts",
  },
  CATEGORIES: {
    LIST: "/categories",
    SINGLE: (id: string | number) => `/categories/${id}`,
  },
  SUBCATEGORIES: {
    LIST: "/subcategories",
    SINGLE: (id: string | number) => `/subcategories/${id}`,
    BY_CATEGORY: (id: string | number) => `/subcategories?categoryId=${id}`,
  },
  CART: {
    LIST: "/cart",
    ADD: "/cart",
    UPDATE: "/cart",
    DELETE: "/cart",
  },
  ORDERS: {
    LIST: "/orders",
    CREATE: "/orders",
    SINGLE: (id: string | number) => `/orders/${id}`,
    TRACK: (id: string | number) => `/orders/track/${id}`,
    VERIFY: "/orders/verify",
    INVOICE: (id: string | number) => `/invoice/${id}`,
  },
  ADDRESS: {
    LIST: "/address",
    CREATE: "/address",
    UPDATE: (id: string | number) => `/address/${id}`,
    DELETE: (id: string | number) => `/address/${id}`,
  },
  BANNERS: {
    LIST: "/banners",
    CREATE: "/banners",
    UPDATE: (id: string | number) => `/banners/${id}`,
    DELETE: (id: string | number) => `/banners/${id}`,
  },
  HEADERS: {
    LIST: "/headers",
    CREATE: "/headers",
    UPDATE: (id: string | number) => `/headers/${id}`,
    DELETE: (id: string | number) => `/headers/${id}`,
  },
  BLOG: {
    LIST: "/blog",
    SINGLE: (slugOrId: string | number) => `/blog/${slugOrId}`,
    CREATE: "/blog",
    UPDATE: (id: string | number) => `/blog/${id}`,
    DELETE: (id: string | number) => `/blog/${id}`,
  },
  REVIEWS: {
    LIST: "/reviews",
    CREATE: "/reviews",
    DELETE: (id: string | number) => `/reviews/${id}`,
  },
  COUNTRY_PRICING: {
    LIST: "/country-pricing",
    CREATE: "/country-pricing",
    UPDATE: (id: string | number) => `/country-pricing/${id}`,
    DELETE: (id: string | number) => `/country-pricing/${id}`,
  },
  COUNTRY_TAX: {
    LIST: "/country-tax",
    ALL: "/country-tax/all",
    BY_COUNTRY: (code: string) => `/country-tax?country=${code}`,
    UPDATE: (id: string | number) => `/country-tax/${id}`,
    DELETE: (id: string | number) => `/country-tax/${id}`,
  },
  SHIPPING_PRICING: {
    LIST: "/shipping-pricing",
    BY_COUNTRY: (code: string) => `/shipping-pricing/countryWise?country=${code}`,
    CREATE: "/shipping-pricing",
    UPDATE: (id: string | number) => `/shipping-pricing/${id}`,
    DELETE: (id: string | number) => `/shipping-pricing/${id}`,
  },
  OFFERS: {
    LIST: "/offers",
    CREATE: "/offers",
    // Backend PUT/DELETE take the id in the request body, not the path.
    UPDATE: "/offers",
    DELETE: "/offers",
  },
  PROMO_CODES: {
    LIST: "/promo-codes",
    CREATE: "/promo-codes",
    APPLY: "/promo-codes/apply",
    UPDATE: (id: string | number) => `/promo-codes/${id}`,
    DELETE: (id: string | number) => `/promo-codes/${id}`,
    USAGE: "/promo-codes/usage",
  },
  TAGS: {
    LIST: "/tags",
    SINGLE: (id: string | number) => `/tags/${id}`,
    CREATE: "/tags",
    UPDATE: (id: string | number) => `/tags/${id}`,
    DELETE: (id: string | number) => `/tags/${id}`,
  },
  ATTRIBUTES: {
    LIST: "/attributes",
    SINGLE: (id: string | number) => `/attributes/${id}`,
    CREATE: "/attributes",
    UPDATE: (id: string | number) => `/attributes/${id}`,
    DELETE: (id: string | number) => `/attributes/${id}`,
  },
  WAREHOUSE: {
    LIST: "/warehouse",
    CREATE: "/warehouse",
    // Backend uses query-string ids for warehouse PUT/DELETE.
    UPDATE: (id: string | number) => `/warehouse?id=${id}`,
    DELETE: (id: string | number) => `/warehouse?id=${id}`,
    PUBLIC_CITIES: "/warehouse/public-cities",
  },
  DONATIONS: {
    LIST: "/donations",
    CREATE: "/donations",
    UPDATE: (id: string | number) => `/donations/${id}`,
    DELETE: (id: string | number) => `/donations/${id}`,
    BY_COUNTRY: (code: string) => `/donations/country/${code}`,
    CAMPAIGNS: "/donation-campaigns",
    CAMPAIGN: (id: string | number) => `/donation-campaigns/${id}`,
    DONORS: "/donations/donors",
  },
  VIDEO_STORY: {
    LIST: "/video-story",
    CREATE: "/video-story",
    UPDATE: (id: string | number) => `/video-story/${id}`,
    DELETE: (id: string | number) => `/video-story/${id}`,
  },
  STATES: {
    LIST: "/state",
  },
  UPLOAD: "/upload",
  CONTACT: {
    SEND: "/contact",
    LIST: "/contact",
    REPLY: (id: string | number) => `/contact/${id}/reply`,
    MARK_READ: (id: string | number) => `/contact/${id}/read`,
    DELETE: (id: string | number) => `/contact/${id}`,
  },
  MARKET_LINKS: {
    LIST: "/market-links",
    BY_PRODUCT: (productId: string) =>
      `/market-links?productId=${encodeURIComponent(productId)}`,
    SINGLE: (id: string | number) => `/market-links/${id}`,
    CREATE: "/market-links",
    UPDATE: (id: string | number) => `/market-links/${id}`,
    DELETE: (id: string | number) => `/market-links/${id}`,
  },
  SKU_MAPPING: {
    LIST: "/sku-mapping",
    CREATE: "/sku-mapping",
  },
  LOCATION: {
    STATES: "/state",
    CREATE_STATE: "/state",
    DELETE_STATE: (id: string | number) => `/state/${id}`,
  },
  GEOGRAPHIC: {
    COUNTRIES: "/country",
    STATES_BY_COUNTRY: (countryId: number) => `/country-state?countryId=${countryId}`,
    CITIES_BY_STATE: (stateId: number) => `/country-city?stateId=${stateId}`,
  },
  SEND_TO_WAREHOUSE: {
    LIST: "/send_to_warehouse",
    CREATE: "/send_to_warehouse",
  },
  DELHI_STORE: {
    LIST: "/delhi_store",
    UPDATE: (id: string | number) => `/delhi_store/${id}`,
  },
  BANGALORE_INVENTORY: {
    LIST: "/banglore_increff_inventory",
    SYNC: "/banglore_increff_inventory/sync",
  },
  JYOTISH: {
    REGISTER: "/jyotish/register",
    LOGIN: "/jyotish/login",
    ASTROLOGER: {
      LIST: "/jyotish/astrologer",
      SINGLE: (id: string | number) => `/jyotish/astrologer/${id}`,
      UPDATE: (id: string | number) => `/jyotish/astrologer/${id}`,
      APPROVE: (id: string | number) => `/jyotish/astrologer/${id}/approve`,
      REJECT: (id: string | number) => `/jyotish/astrologer/${id}/reject`,
      SET_COMMISSION: (id: string | number) => `/jyotish/astrologer/${id}/commission`,
    },
    CHAT: {
      SESSIONS: "/jyotish/chat/sessions",
      START: "/jyotish/chat/start-session",
      SESSION: (id: string | number) => `/jyotish/chat/session/${id}`,
    },
    AD_CAMPAIGN: {
      LIST: "/jyotish/ad-campaign",
      CREATE: "/jyotish/ad-campaign",
      UPDATE: (id: string | number) => `/jyotish/ad-campaign/${id}`,
    },
    PROFILE_EDIT: {
      LIST: "/jyotish/profile-edit-requests",
      CREATE: "/jyotish/profile-edit-requests",
      APPROVE: (id: string | number) => `/jyotish/profile-edit-requests/${id}/approve`,
      REJECT: (id: string | number) => `/jyotish/profile-edit-requests/${id}/reject`,
    },
    SERVICES: "/book_consultant/services",
    SLOTS: "/book_consultant/slots",
    DURATIONS: "/book_consultant/duration",
    TAX_CONFIG: {
      GET: "/jyotish/config/tax",
      UPDATE: "/jyotish/config/tax",
    },
  },
  BOOK_CONSULTANT: {
    SERVICES: "/book_consultant/services",
    SLOTS: "/book_consultant/slots",
    DURATIONS: "/book_consultant/duration",
    ASTROLOGERS: "/book_consultant/astrologers",
    BOOK: "/book_consultant/book",
  },
  WALLET: {
    BALANCE: "/wallet",
    TRANSACTIONS: "/wallet/transactions",
  },
  CHAT: {
    SESSIONS: "/chat",
    MESSAGES: (id: string | number) => `/chat/${id}/messages`,
    SEND: (id: string | number) => `/chat/${id}/send`,
  },
  PAYMENTS: {
    PAYU_SUCCESS: "/payu/success",
    PAYU_FAILURE: "/payu/failure",
    PAYGLOCAL_CALLBACK: "/payglocal/callback",
    ADJUSTMENTS: "/order-adjustments",
  },
} as const;
