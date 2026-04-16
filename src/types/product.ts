export interface Product {
  id: number;
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  price: number;
  mrp?: number;
  discount?: number;
  sku?: string;
  stock: number;
  images: string[];
  thumbnail?: string;
  categoryId: number;
  subcategoryId?: number;
  category?: { id: number; name: string };
  subcategory?: { id: number; name: string };
  tags?: Tag[];
  attributes?: ProductAttribute[];
  variations?: ProductVariation[];
  marketLinks?: MarketLink[];
  isActive: boolean;
  isFeatured?: boolean;
  weight?: number;
  dimensions?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariation {
  id: number;
  productId: number;
  name: string;
  sku?: string;
  price: number;
  mrp?: number;
  stock: number;
  attributes: Record<string, string>;
  image?: string;
  isActive: boolean;
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
  productId: number;
  platform: string;
  url: string;
}

export interface ProductFilters {
  categoryId?: number;
  subcategoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
