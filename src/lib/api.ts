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
  },
  PRODUCTS: {
    LIST: "/products",
    FAST: "/products/fast",
    ALL: "/products/all",
    SINGLE: (id: string | number) => `/products/${id}`,
    MASTER: "/masterProducts",
  },
  CATEGORIES: {
    LIST: "/category",
    SINGLE: (id: string | number) => `/category/${id}`,
  },
  SUBCATEGORIES: {
    LIST: "/subcategory",
    SINGLE: (id: string | number) => `/subcategory/${id}`,
    BY_CATEGORY: (id: string | number) => `/subcategory/category/${id}`,
  },
  CART: {
    LIST: "/addToCart",
    ADD: "/addToCart",
    UPDATE: (id: string | number) => `/addToCart/${id}`,
    DELETE: (id: string | number) => `/addToCart/${id}`,
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
    LIST: "/banner",
    CREATE: "/banner",
    UPDATE: (id: string | number) => `/banner/${id}`,
    DELETE: (id: string | number) => `/banner/${id}`,
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
    LIST: "/countryPricing",
    CREATE: "/countryPricing",
    UPDATE: (id: string | number) => `/countryPricing/${id}`,
    DELETE: (id: string | number) => `/countryPricing/${id}`,
  },
  COUNTRY_TAX: {
    LIST: "/countrytax",
    BY_COUNTRY: (code: string) => `/countrytax/${code}`,
  },
  SHIPPING_PRICING: {
    LIST: "/shipping-pricing",
    BY_COUNTRY: (code: string) => `/shipping-pricing/country/${code}`,
    CREATE: "/shipping-pricing",
    UPDATE: (id: string | number) => `/shipping-pricing/${id}`,
    DELETE: (id: string | number) => `/shipping-pricing/${id}`,
  },
  OFFERS: {
    LIST: "/offers",
    CREATE: "/offers",
    UPDATE: (id: string | number) => `/offers/${id}`,
    DELETE: (id: string | number) => `/offers/${id}`,
  },
  PROMO_CODES: {
    LIST: "/promo_code",
    CREATE: "/promo_code",
    APPLY: "/promo_code/apply",
    DELETE: (id: string | number) => `/promo_code/${id}`,
  },
  TAGS: {
    LIST: "/tags",
    CREATE: "/tags",
    DELETE: (id: string | number) => `/tags/${id}`,
  },
  ATTRIBUTES: {
    LIST: "/attribute",
    CREATE: "/attribute",
    DELETE: (id: string | number) => `/attribute/${id}`,
  },
  WAREHOUSE: {
    LIST: "/warehouse_location",
    CREATE: "/warehouse_location",
    DELETE: (id: string | number) => `/warehouse_location/${id}`,
  },
  DONATIONS: {
    LIST: "/donate",
    CREATE: "/donate",
    BY_COUNTRY: (code: string) => `/donate/country/${code}`,
  },
  VIDEO_STORY: {
    LIST: "/videoStory",
    CREATE: "/videoStory",
    DELETE: (id: string | number) => `/videoStory/${id}`,
  },
  UPLOAD: "/upload",
  CONTACT: {
    SEND: "/contact",
    LIST: "/contact",
  },
  MARKET_LINKS: {
    LIST: "/externalMarket",
    CREATE: "/externalMarket",
    DELETE: (id: string | number) => `/externalMarket/${id}`,
  },
  SKU_MAPPING: {
    LIST: "/mapping",
    CREATE: "/mapping",
  },
  LOCATION: {
    STATES: "/location_State",
    CREATE_STATE: "/location_State",
    DELETE_STATE: (id: string | number) => `/location_State/${id}`,
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
    CASHFREE_INIT: "/payments/cashfree/init",
    PAYGLOCAL_CALLBACK: "/payglocal/callback",
    ADJUSTMENTS: "/adjustments",
  },
} as const;
