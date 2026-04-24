export interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  short?: string;
  price: string;
  MRP?: string;
  sku: string;
  stock: string;
  image: string[];
  categoryId?: number;
  subcategoryId: number;
  category?: { id: number; name: string };
  subcategory?: { id: number; name: string };
  tags?: Tag[];
  attributes?: ProductAttribute[];
  variations?: ProductVariation[];
  marketLinks?: MarketLink[];
  active: boolean;
  deleted: number;
  color: string[];
  size: string[];
  weight?: number;
  dimensions?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  offerId?: number;
  offers?: Offer[];
  primaryOffer?: Offer;
  bulkPrice?: string;
  minQuantity?: string;
  barCode?: string;
  platform: string[];
  dimension?: Record<string, unknown>;
  isDefault?: Record<string, unknown>;
  otherCountriesPrice?: string;
  currency?: string;
  currencySymbol?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariation {
  id: string;
  productId: string;
  name?: string;
  variationName?: string;
  sku?: string;
  price: string;
  MRP?: string;
  mrp?: string;
  stock: string;
  attributes?: Record<string, string>;
  /** Structured attribute list stored on the DB row, e.g.
   *  `[{ name: "Color", value: "Red" }, { name: "Form", value: "Pack of 2" }]`.
   *  Preferred over parsing variationName when present. */
  attributeCombo?: Array<{ name: string; value: string }>;
  image?: string | string[];
  active: boolean;
  deleted?: number;
  barCode?: string;
  bulkPrice?: string;
  minQuantity?: string;
  short?: string;
  description?: string;
  offerId?: number;
  otherCountriesPrice?: string;
  dimension?: Record<string, unknown>;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductAttribute {
  id: number;
  name: string;
  values: string[];
}

export interface Tag {
  id: number;
  name: string;
  slug?: string;
  active?: boolean;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarketLink {
  id: string;
  productId?: string | null;
  name: string;
  url: string;
  countryName: string;
  countryCode: string;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Offer {
  id: number;
  name: string;
  discountType: string;
  discountValue: Record<string, unknown>;
  type?: Record<string, unknown>;
  description?: string;
  active: boolean;
  deleted: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  categoryId?: number | string;
  subcategoryId?: number | string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  tags?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  letter?: string;
  /** Platform the request originates from — wizard | quickgo | jyotish. */
  platform?: string;
  /**
   * City name for QuickGo — the EFFECTIVE fulfillment city the shopper
   * picked on the landing modal. Backend resolves warehouses with this
   * city as their fulfillment parent (so Faridabad pincodes still route
   * to Delhi stock when Faridabad is fulfilled from Delhi).
   */
  city?: string;
  /**
   * Pincode the shopper picked alongside `city`. Backend uses this to
   * narrow WareHouse matches and then picks the correct per-city stock
   * table (DelhiWarehouseStock or BangaloreIncreffInventory) off the
   * matched warehouse's fulfillment parent.
   */
  pincode?: string;
}
