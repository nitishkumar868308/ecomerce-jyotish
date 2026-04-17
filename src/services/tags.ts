import { useQuery } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Tag } from "@/types/product";
import type { ApiResponse } from "@/types/api";

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Tag[]>>(ENDPOINTS.TAGS.LIST);
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
