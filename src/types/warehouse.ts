export interface WarehouseLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isActive: boolean;
  createdAt: string;
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
