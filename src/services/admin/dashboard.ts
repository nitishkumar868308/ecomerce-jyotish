import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  recentOrders: number;
  monthlySales: { month: string; revenue: number; orders: number }[];
  topProducts: { id: number; name: string; sold: number; revenue: number }[];
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AdminStats>>("/admin/stats");
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}
