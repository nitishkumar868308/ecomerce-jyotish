export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  isActive: boolean;
  order?: number;
  subcategories?: Subcategory[];
  _count?: { products: number };
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  categoryId: number;
  category?: { id: number; name: string };
  isActive: boolean;
  order?: number;
  _count?: { products: number };
  createdAt: string;
  updatedAt: string;
}
