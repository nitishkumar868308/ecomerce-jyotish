import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

// ── Backend shapes ──────────────────────────────────────────

/** `State` row — master location entry referenced by banners/categories. */
export interface LocationState {
  id: number;
  countryId?: number | null;
  countryName?: string | null;
  stateRefId?: number | null;
  name: string;
  cityRefId?: number | null;
  city?: string | null;
  active: boolean;
  deleted: number;
  createdAt: string;
}

/** `Country` row from GET /country — mirrors the backend Country model. */
export interface Country {
  id: number;
  name: string;
  iso2?: string;
  iso3?: string;
  numeric_code?: string;
  phonecode?: string;
  capital?: string | null;
  currency?: string | null;
  currency_name?: string | null;
  currency_symbol?: string | null;
  nationality?: string | null;
  emoji?: string | null;
  emojiU?: string | null;
  active?: boolean;
  /** Legacy alias retained for existing callers. */
  code?: string;
}

/** `StateCountry` row returned by GET /country-state?countryId=. */
export interface StateCountry {
  id: number;
  name: string;
  country_id?: number;
  country_code?: string;
  iso2?: string;
  active?: boolean;
}

/** `CityCountry` row returned by GET /country-city?stateId=. */
export interface CityCountry {
  id: number;
  name: string;
  state_id: number;
  state_name?: string;
  country_id?: number;
  country_code?: string;
  active?: boolean;
}

// ── Hooks ───────────────────────────────────────────────────

export function useLocationStates() {
  return useQuery({
    queryKey: ["admin", "locationStates"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<LocationState[]>>(
        ENDPOINTS.LOCATION.STATES,
      );
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCountries() {
  return useQuery({
    queryKey: ["geographic", "countries"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Country[]>>(
        ENDPOINTS.GEOGRAPHIC.COUNTRIES,
      );
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStatesByCountry(countryId?: number) {
  return useQuery({
    queryKey: ["geographic", "statesByCountry", countryId],
    queryFn: async () => {
      if (!countryId) return [];
      const { data } = await api.get<ApiResponse<StateCountry[]>>(
        ENDPOINTS.GEOGRAPHIC.STATES_BY_COUNTRY(countryId),
      );
      return data.data;
    },
    enabled: !!countryId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCitiesByState(stateId?: number) {
  return useQuery({
    queryKey: ["geographic", "citiesByState", stateId],
    queryFn: async () => {
      if (!stateId) return [];
      const { data } = await api.get<ApiResponse<CityCountry[]>>(
        ENDPOINTS.GEOGRAPHIC.CITIES_BY_STATE(stateId),
      );
      return data.data;
    },
    enabled: !!stateId,
    staleTime: 5 * 60 * 1000,
  });
}

export interface CreateStatePayload {
  countryId?: number;
  countryName?: string;
  stateRefId?: number;
  name: string;
  cityRefId?: number;
  city?: string;
  active?: boolean;
}

export function useCreateState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateStatePayload) => {
      const { data } = await api.post<ApiResponse<LocationState>>(
        ENDPOINTS.LOCATION.CREATE_STATE,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "locationStates"] });
      toast.success("Location added!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add location");
    },
  });
}

export function useUpdateState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: { id: number } & Partial<CreateStatePayload>) => {
      const { data } = await api.put<ApiResponse<LocationState>>(
        `/state/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "locationStates"] });
      toast.success("Location updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update location");
    },
  });
}

export function useDeleteState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(ENDPOINTS.LOCATION.DELETE_STATE(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "locationStates"] });
      toast.success("State deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete state");
    },
  });
}
