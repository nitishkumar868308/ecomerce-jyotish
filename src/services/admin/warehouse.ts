import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type {
  WarehouseLocation,
  WarehousePublicCity,
} from "@/types/warehouse";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

// --- Warehouse Locations ---

export function useWarehouseLocations() {
  return useQuery({
    queryKey: ["admin", "warehouses"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<WarehouseLocation[]>>(
        ENDPOINTS.WAREHOUSE.LIST,
      );
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

const PINCODE_RE = /^\d{6}$/;

/**
 * Collapse a flat warehouse list into the city-bucketed shape the storefront
 * expects — dedupes pincodes per (city, state) and skips inactive/deleted
 * rows. Used as a fallback when the dedicated public-cities endpoint isn't
 * deployed on the backend.
 */
function aggregatePublicCities(
  list: WarehouseLocation[],
): WarehousePublicCity[] {
  const bucket = new Map<string, WarehousePublicCity>();
  for (const w of list) {
    if (!w.active || w.deleted || !w.city) continue;
    const pincodes = (w.pincode || "")
      .split(/[^0-9]+/)
      .map((t) => t.trim())
      .filter((t) => PINCODE_RE.test(t));
    const key = `${w.city.toLowerCase()}__${w.state.toLowerCase()}`;
    const existing = bucket.get(key);
    if (existing) {
      const seen = new Set(existing.pincodes);
      for (const p of pincodes) {
        if (!seen.has(p)) {
          existing.pincodes.push(p);
          seen.add(p);
        }
      }
    } else {
      bucket.set(key, {
        city: w.city,
        state: w.state,
        cityRefId: w.cityRefId ?? null,
        pincodes: Array.from(new Set(pincodes)),
      });
    }
  }
  return Array.from(bucket.values());
}

/**
 * Public lookup used by the storefront (QuickGo landing modal etc.) —
 * returns active warehouses grouped by city along with pincodes.
 *
 * Tries the dedicated `/warehouse/public-cities` endpoint first; falls back
 * to aggregating the main warehouse list client-side so the storefront keeps
 * working when the backend hasn't exposed the public endpoint yet.
 */
export function useWarehousePublicCities() {
  return useQuery({
    queryKey: ["warehouse", "publicCities"],
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiResponse<WarehousePublicCity[]>>(
          ENDPOINTS.WAREHOUSE.PUBLIC_CITIES,
        );
        if (Array.isArray(data?.data) && data.data.length > 0) {
          return data.data;
        }
        // Empty or malformed response — fall through to aggregation.
      } catch {
        // Swallow and try the fallback.
      }
      const { data } = await api.get<ApiResponse<WarehouseLocation[]>>(
        ENDPOINTS.WAREHOUSE.LIST,
      );
      return aggregatePublicCities(data.data ?? []);
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<WarehouseLocation>) => {
      const { data } = await api.post<ApiResponse<WarehouseLocation>>(
        ENDPOINTS.WAREHOUSE.CREATE,
        payload,
      );
      return data.data;
    },
    // Await the refetch so callers that `await mutateAsync` see fresh list
    // data before closing the dialog — otherwise the table lags a frame and
    // looks like it needs a manual refresh.
    onSuccess: async () => {
      await Promise.all([
        qc.refetchQueries({ queryKey: ["admin", "warehouses"] }),
        qc.refetchQueries({ queryKey: ["warehouse", "publicCities"] }),
      ]);
      toast.success("Warehouse created!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create warehouse",
      );
    },
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<WarehouseLocation> & { id: number }) => {
      const { data } = await api.put<ApiResponse<WarehouseLocation>>(
        ENDPOINTS.WAREHOUSE.UPDATE(id),
        payload,
      );
      return data.data;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.refetchQueries({ queryKey: ["admin", "warehouses"] }),
        qc.refetchQueries({ queryKey: ["warehouse", "publicCities"] }),
      ]);
      toast.success("Warehouse updated!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update warehouse",
      );
    },
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.WAREHOUSE.DELETE(id));
    },
    onSuccess: async () => {
      await Promise.all([
        qc.refetchQueries({ queryKey: ["admin", "warehouses"] }),
        qc.refetchQueries({ queryKey: ["warehouse", "publicCities"] }),
      ]);
      toast.success("Warehouse deleted!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete warehouse",
      );
    },
  });
}

// --- Send to Warehouse ---

export function useSendToWarehouse() {
  return useQuery({
    queryKey: ["admin", "sendToWarehouse"],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.SEND_TO_WAREHOUSE.LIST);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateSendToWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post(ENDPOINTS.SEND_TO_WAREHOUSE.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "sendToWarehouse"] });
      toast.success("Sent to warehouse!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send to warehouse");
    },
  });
}

// --- Delhi Store ---

export function useDelhiStore() {
  return useQuery({
    queryKey: ["admin", "delhiStore"],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.DELHI_STORE.LIST);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateDelhiStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number; [key: string]: unknown }) => {
      const { data } = await api.put(ENDPOINTS.DELHI_STORE.UPDATE(id), payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "delhiStore"] });
      toast.success("Delhi store updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update Delhi store");
    },
  });
}

// --- Bangalore Inventory ---

export interface BangaloreInventoryRow {
  id: number;
  channelSkuCode: string;
  locationCode: string;
  quantity: number;
  stock: number;
  clientSkuId: string | null;
  minExpiry: string | null;
  updatedAt: string;
  lastSynced: string;
  sku: string | null;
  mapped: boolean;
  mappingId: number | null;
  product: { name: string; sku: string } | null;
}

export interface BangaloreInventoryResponse {
  data: BangaloreInventoryRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useBangaloreInventory(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery<BangaloreInventoryResponse>({
    queryKey: [
      "admin",
      "bangaloreInventory",
      params?.page ?? 1,
      params?.limit ?? 20,
      params?.search ?? "",
    ],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.BANGALORE_INVENTORY.LIST, {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          search: params?.search || undefined,
        },
      });
      return data.data as BangaloreInventoryResponse;
    },
    staleTime: 60 * 1000,
  });
}

export function useSyncBangaloreInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(ENDPOINTS.BANGALORE_INVENTORY.SYNC);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "bangaloreInventory"] });
      toast.success("Bangalore inventory synced!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to sync inventory");
    },
  });
}
