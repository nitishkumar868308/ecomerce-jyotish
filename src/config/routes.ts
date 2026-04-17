export const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  CONTACT: "/contact",
  FAQ: "/faq",
  PRIVACY: "/privacy-policy",
  TERMS: "/terms-and-conditions",
  SHIPPING_POLICY: "/shipping-and-return-policy",
  REFUND_POLICY: "/refund-policy",
  DONATE: "/donate",

  // Products & Categories
  CATEGORIES: "/categories",
  CATEGORY: (categoryName: string) => `/categories/${encodeURIComponent(categoryName)}`,
  SUBCATEGORY: (categoryName: string, subName: string) => `/categories/${encodeURIComponent(categoryName)}/${encodeURIComponent(subName)}`,
  PRODUCT: (id: string | number) => `/product/${id}`,

  // Blog
  BLOG: "/blog",
  BLOG_POST: (slug: string) => `/blog/${slug}`,

  // Checkout
  CHECKOUT: "/checkout",

  // Auth
  RESET_PASSWORD: "/reset-password",
  REGISTER_JYOTISH: "/register-jyotish",
  LOGIN_JYOTISH: "/login-jyotish",

  // Dashboard
  DASHBOARD: "/dashboard",
  DASHBOARD_ORDERS: "/dashboard/orders",
  DASHBOARD_ADDRESSES: "/dashboard/addresses",
  DASHBOARD_WALLET: "/dashboard/wallet",
  DASHBOARD_PROFILE: "/dashboard/profile",

  // Payments
  PAYMENT_SUCCESS: "/payment-success",
  PAYMENT_FAILED: "/payment-failed",
  PAYMENT_PROCESSING: "/payment-processing",

  // Chat
  CHAT: "/chat",
  CHAT_SESSION: (id: string | number) => `/chat/${id}`,

  // Book Consultant
  BOOK_CONSULTANT: "/book-consultant",

  // Admin
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    PRODUCTS: "/admin/products",
    PRODUCTS_CREATE: "/admin/products/create",
    ATTRIBUTE: "/admin/attribute",
    ORDERS: "/admin/orders",
    ORDERS_CREATE: "/admin/orders/create",
    CATEGORIES: "/admin/categories",
    SUBCATEGORY: "/admin/subcategory",
    HEADER: "/admin/header",
    BANNERS: "/admin/banners",
    USERS: "/admin/users",
    REVIEWS: "/admin/reviews",
    PROMO_CODE: "/admin/promo-code",
    DONATE: "/admin/donate",
    COUNTRY_TAXES: "/admin/country-taxes",
    COUNTRY_PRICING: "/admin/country-pricing",
    SHIPPING_PRICING: "/admin/shipping-pricing",
    VIDEO_STORY: "/admin/video-story",
    BLOG: "/admin/blog",
    TAGS: "/admin/tags",
    OFFER: "/admin/offer",
    EXTERNAL_MARKET: "/admin/external-market",
    CONTACT_MESSAGES: "/admin/contact-messages",
    LOCATION_STATE: "/admin/location-state",
    WAREHOUSE_LOCATION: "/admin/warehouse-location",
    SEND_TO_WAREHOUSE: "/admin/send-to-warehouse",
    DELHI_STORE: "/admin/delhi-store",
    BANGALORE_INVENTORY: "/admin/bangalore-inventory",
    SKU_MAPPING: "/admin/sku-mapping",
    JYOTISH_AD_CAMPAIGN: "/admin/jyotish/ad-campaign",
    JYOTISH_ASTROLOGER_DETAIL: "/admin/jyotish/astrologer-detail",
    JYOTISH_PROFILE_EDIT_REQUESTS: "/admin/jyotish/profile-edit-requests",
  },

  // Jyotish
  JYOTISH: {
    HOME: "/jyotish",
    ABOUT: "/jyotish/about",
    CONTACT: "/jyotish/contact",
    CONSULT_NOW: "/jyotish/consult-now",
    ASTROLOGER: (id: string | number) => `/jyotish/astrologer/${id}`,
    DASHBOARD: "/jyotish/astrologer-dashboard",
    DASHBOARD_CHAT: (id: string | number) => `/jyotish/astrologer-dashboard/chat/${id}`,
    DASHBOARD_WALLET: "/jyotish/astrologer-dashboard/wallet",
    DASHBOARD_PROFILE: "/jyotish/astrologer-dashboard/profile",
    CHAT: (id: string | number) => `/jyotish/chat/${id}`,
  },

  // Hecate QuickGo
  QUICKGO: {
    HOME: "/hecate-quickgo/home",
    CATEGORIES: "/hecate-quickgo/categories",
    PRODUCT: (id: string | number) => `/hecate-quickgo/product/${id}`,
    CHECKOUT: "/hecate-quickgo/checkout",
    DASHBOARD: "/hecate-quickgo/dashboard",
  },
} as const;
