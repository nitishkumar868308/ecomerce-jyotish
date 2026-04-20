export interface WarehouseLocation {
  id: number;
  name: string;
  code: string;
  address: string;
  /** Denormalised city name (pulled from Location master when picked). */
  city?: string | null;
  /** Optional FK into the State (Location) master. */
  cityRefId?: number | null;
  state: string;
  pincode: string;
  contact?: string | null;
  active: boolean;
  deleted?: boolean;
  fulfillmentWarehouseId?: number | null;
  createdAt?: string;
}

export interface WarehousePublicCity {
  city: string;
  state: string;
  cityRefId: number | null;
  pincodes: string[];
}

export interface SkuMapping {
  id: number;
  productId: number;
  product?: { id: number; name: string };
  sku: string;
  warehouseSku: string;
  warehouseId?: number;
  createdAt: string;
}
