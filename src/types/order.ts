export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "REFUNDED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "COD" | "PAYU" | "CASHFREE" | "PAYGLOCAL" | "WALLET";

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  user?: { id: number; name: string; email: string };
  items: OrderItem[];
  address: OrderAddress;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  promoCode?: string;
  notes?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  product?: { id: number; name: string; thumbnail?: string; images: string[] };
  variationId?: number;
  variation?: { name: string; attributes: Record<string, string> };
  name: string;
  price: number;
  quantity: number;
  total: number;
  sku?: string;
}

export interface OrderAddress {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface CreateOrderPayload {
  addressId: number;
  paymentMethod: PaymentMethod;
  promoCode?: string;
  notes?: string;
}
