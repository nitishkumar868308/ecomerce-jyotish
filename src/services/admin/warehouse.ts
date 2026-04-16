import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { WarehouseLocation } from "@/types/warehouse";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

// --- Warehouse Locations ---

export function useWarehouseLocations() {
  return useQuery({
    queryKey: ["admin", "warehouses"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<WarehouseLocation[]>>(ENDPOINTS.WAREHOUSE.LIST);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<WarehouseLocation>) => {
      const { data } = await api.post<ApiResponse<WarehouseLocation>>(ENDPOINTS.WAREHOUSE.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "warehouses"] });
      toast.success("Warehouse created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create warehouse");
    },
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.WAREHOUSE.DELETE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "warehouses"] });
      toast.success("Warehouse deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete warehouse");
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

export function useBangaloreInventory() {
  return useQuery({
    queryKey: ["admin", "bangaloreInventory"],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.BANGALORE_INVENTORY.LIST);
      return data.data;
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
