import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import toast from "react-hot-toast";

/**
 * Fetch one astrologer. When called from a public-facing surface (the
 * `/jyotish/astrologer/[id]` profile page), pass `publicOnly: true` so
 * the backend 404s if the astrologer isn't approved + active + non-
 * rejected. The dashboard calls it WITHOUT the flag because an
 * astrologer still needs to see their own record while pending review.
 */
export function useAstrologerProfile(
  id: string | number,
  opts?: { publicOnly?: boolean },
) {
  const publicOnly = !!opts?.publicOnly;
  return useQuery({
    queryKey: ["jyotish", "astrologer", id, publicOnly ? "public" : "own"],
    queryFn: async () => {
      // Backend exposes the single-astrologer fetch as a query param on
      // the list endpoint (`/jyotish/astrologer?id=…`), not a path
      // param — calling SINGLE(id) with a path id hits a route the
      // controller doesn't serve. Pass both through query.
      const params: Record<string, string> = { id: String(id) };
      if (publicOnly) params.public = "true";
      const { data } = await api.get(ENDPOINTS.JYOTISH.ASTROLOGER.LIST, {
        params,
      });
      return data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAstrologers() {
  return useQuery({
    queryKey: ["jyotish", "astrologers", "public"],
    queryFn: async () => {
      // `?public=true` tells the backend to return ONLY
      // isApproved=true && isActive=true && isRejected=false astrologers.
      // Public surfaces (home, consult-now, astrologer [id]) never show
      // pending / rejected / inactive profiles — the admin roster uses a
      // separate hook (useAdminAstrologers) that skips this filter.
      const { data } = await api.get(ENDPOINTS.JYOTISH.ASTROLOGER.LIST, {
        params: { public: "true" },
      });
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateAstrologerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string | number; [key: string]: any }) => {
      const { data } = await api.put(ENDPOINTS.JYOTISH.ASTROLOGER.UPDATE(id), payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["jyotish", "astrologer", variables.id] });
      qc.invalidateQueries({ queryKey: ["jyotish", "astrologers"] });
      toast.success("Profile updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });
}

/**
 * Astrologer-side availability toggle. Persists `isOnline` on the
 * AstrologerAccount row. Invalidates both the astrologer's own
 * profile query (dashboard header badge) and the public
 * `useAstrologers` list (so the storefront drops offline astrologers
 * within one refetch cycle).
 */
export function useSetAstrologerOnline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: number | string; online: boolean }) => {
      const { data } = await api.post(
        `/jyotish/astrologer/${args.id}/online`,
        { online: args.online },
      );
      return data;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["jyotish", "astrologer", vars.id] });
      qc.invalidateQueries({ queryKey: ["jyotish", "astrologers"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Could not update status.");
    },
  });
}

export function useCreateProfileEditRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { [key: string]: any }) => {
      const { data } = await api.post(ENDPOINTS.JYOTISH.PROFILE_EDIT.CREATE, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jyotish", "profileEditRequests"] });
      qc.invalidateQueries({ queryKey: ["jyotish", "myProfileEditRequests"] });
      toast.success("Profile edit request submitted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit edit request");
    },
  });
}

export function useMyProfileEditRequests(astrologerId: string | number | undefined) {
  return useQuery({
    queryKey: ["jyotish", "myProfileEditRequests", astrologerId],
    queryFn: async () => {
      // Astrologer-scoped endpoint — public so the dashboard can read
      // it without admin auth. (The full admin list still requires an
      // admin JWT on a sibling route.)
      const { data } = await api.get(
        `/jyotish/profile-edit-requests/by-astrologer/${astrologerId}`,
      );
      const list = data?.data ?? data ?? [];
      return list;
    },
    enabled: !!astrologerId,
    staleTime: 30 * 1000,
  });
}
