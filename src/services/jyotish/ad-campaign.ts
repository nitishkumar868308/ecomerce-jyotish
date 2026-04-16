import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import toast from "react-hot-toast";

export function useMyAdCampaigns() {
  return useQuery({
    queryKey: ["jyotish", "adCampaigns"],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.JYOTISH.AD_CAMPAIGN.LIST);
      return data.data;
    },
    staleTime: 0,
  });
}

export function useCreateAdCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { [key: string]: any }) => {
      const { data } = await api.post(ENDPOINTS.JYOTISH.AD_CAMPAIGN.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jyotish", "adCampaigns"] });
      toast.success("Ad campaign created!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create ad campaign");
    },
  });
}
