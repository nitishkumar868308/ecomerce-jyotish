"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, ENDPOINTS } from "@/lib/api";

export interface InventoryLocationRow {
  locationCode: string;
  quantity: number;
  minExpiry: string | null;
  updatedAt: string;
  ourSku: string | null;
  mappingId: number | null;
  /** True when the mapping applying here is a per-location override. */
  isOverride: boolean;
}

export interface GroupedInventoryRow {
  channelSkuCode: string;
  totalQuantity: number;
  locations: InventoryLocationRow[];
  globalMapping: { id: number; ourSku: string } | null;
  hasPerLocationOverride: boolean;
  fullyMapped: boolean;
}

export interface InternalSku {
  sku: string;
  label: string;
  kind: "PRODUCT" | "VARIATION";
  productId: number | null;
  productName: string | null;
}

const inventoryKey = ["admin", "sku-mapping", "inventory"] as const;
const internalSkusKey = ["admin", "sku-mapping", "internal-skus"] as const;

export function useSkuInventory() {
  return useQuery({
    queryKey: inventoryKey,
    queryFn: async (): Promise<GroupedInventoryRow[]> => {
      const { data } = await api.get(ENDPOINTS.SKU_MAPPING.INVENTORY);
      return (data?.data ?? data ?? []) as GroupedInventoryRow[];
    },
    staleTime: 30 * 1000,
  });
}

export function useInternalSkus() {
  return useQuery({
    queryKey: internalSkusKey,
    queryFn: async (): Promise<InternalSku[]> => {
      const { data } = await api.get(ENDPOINTS.SKU_MAPPING.INTERNAL_SKUS);
      return (data?.data ?? data ?? []) as InternalSku[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSkuMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      channelSku: string;
      ourSku: string;
      /** Omit (or pass null) to create/update the global mapping. */
      locationCode?: string | null;
    }) => {
      const { data } = await api.post(ENDPOINTS.SKU_MAPPING.CREATE, payload);
      return data;
    },
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: inventoryKey });
      toast.success("Mapping saved");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to save mapping");
    },
  });
}

export function useDeleteSkuMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.SKU_MAPPING.DELETE(id));
    },
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: inventoryKey });
      toast.success("Mapping removed");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to remove mapping");
    },
  });
}
