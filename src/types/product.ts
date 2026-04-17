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
}

export interface MarketLink {
  id: number;
  productId: string;
  platform: string;
  url: string;
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
}
