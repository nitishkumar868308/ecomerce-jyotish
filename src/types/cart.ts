export interface CartItem {
  id: number;
  productId: number;
  variationId?: number;
  product: {
    id: number;
    name: string;
    price: number;
    mrp?: number;
    images: string[];
    thumbnail?: string;
    stock: number;
  };
  variation?: {
    id: number;
    name: string;
    price: number;
    stock: number;
    attributes: Record<string, string>;
  };
  quantity: number;
  price: number;
  total: number;
}

export interface AddToCartPayload {
  productId: number;
  variationId?: number;
  quantity: number;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}
