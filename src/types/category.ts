export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  active: boolean;
  deleted: number;
  platform: string[];
  hsn?: string;
  createdAt: string;
  updatedAt: string;
  subcategories?: Subcategory[];
  countryTaxes?: CountryTax[];
  /** Linked location rows (see State master in backend). */
  states?: Array<{ id: number; name: string; city?: string | null }>;
}

export interface Subcategory {
  id: number;
  name: string;
  slug?: string;
  categoryId: number;
  image?: string;
  active: boolean;
  deleted: number;
  platform: string[];
  offerId?: number;
  createdAt: string;
  updatedAt: string;
  category?: { id: number; name: string };
  /** Linked location rows (see State master in backend). */
  states?: Array<{ id: number; name: string; city?: string | null }>;
}

export interface CountryTax {
  id: number;
  country: string;
  categoryId: number;
  generalTax?: number;
  gstTax?: number;
  active: boolean;
  type?: string;
  countryCode?: string;
}
