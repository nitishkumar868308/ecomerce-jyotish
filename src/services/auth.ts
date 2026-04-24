import { useMutation, useQuery } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { User, LoginPayload, RegisterPayload, AuthResponse } from "@/types/user";
import type { ApiResponse } from "@/types/api";
import { apiError } from "@/lib/apiMessage";
import toast from "react-hot-toast";

export function useMe() {
  const { isLoggedIn, setUser } = useAuthStore();
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      // Backend returns `{ success, user }` for this route — not the generic
      // `{ success, data }` shape. Falling back through both keeps it working
      // regardless of which shape the server ever settles on, and avoids
      // React Query's "Query data cannot be undefined" which was being
      // triggered whenever `data.data` was missing (and was the reason a
      // successful login was immediately rolling back to logged-out state).
      const { data } = await api.get<
        ApiResponse<User> & { user?: User }
      >(ENDPOINTS.AUTH.ME);
      const user = data.user ?? data.data ?? null;
      if (user) setUser(user);
      return user;
    },
    enabled: isLoggedIn,
    staleTime: 0,
  });
}

export function useLogin() {
  const { setAuth, setUser } = useAuthStore();
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await api.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, payload);
      return data;
    },
    onSuccess: (data) => {
      if (data.token) {
        setAuth(data.user, data.token);
      } else {
        setUser(data.user);
      }
      toast.success(`Welcome, ${data.user?.name?.split(" ")[0] || ""}!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Login failed");
    },
  });
}

export function useRegister() {
  const { setAuth, setUser } = useAuthStore();
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await api.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER, payload);
      return data;
    },
    onSuccess: (data) => {
      if (data.token) {
        setAuth(data.user, data.token);
      } else {
        setUser(data.user);
      }
      toast.success(`Welcome, ${data.user?.name?.split(" ")[0] || ""}!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Registration failed");
    },
  });
}

export function useGoogleLogin() {
  const { setAuth, setUser } = useAuthStore();
  return useMutation({
    mutationFn: async (credential: string) => {
      const { data } = await api.post<AuthResponse>(ENDPOINTS.AUTH.GOOGLE, { token: credential });
      return data;
    },
    onSuccess: (data) => {
      if (data.token) {
        setAuth(data.user, data.token);
      } else {
        setUser(data.user);
      }
      toast.success(`Welcome, ${data.user?.name?.split(" ")[0] || ""}!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Google login failed");
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  return useMutation({
    mutationFn: async () => {
      await api.post(ENDPOINTS.AUTH.LOGOUT);
    },
    onSuccess: () => {
      logout();
      toast.success("Logged out");
    },
    onError: () => {
      logout();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      return data;
    },
    // Success/error toasts live on the calling page — the forgot-password
    // flow needs finer control so each of the three steps (request OTP,
    // verify OTP, reset) can surface its own wording.
  });
}

export function useVerifyForgotOtp() {
  return useMutation({
    mutationFn: async (payload: { email: string; otp: string }) => {
      const { data } = await api.post(
        ENDPOINTS.AUTH.VERIFY_FORGOT_OTP,
        payload,
      );
      return data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      token: string;
      password: string;
    }) => {
      const { data } = await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, payload);
      return data;
    },
  });
}

export interface UpdateMyCountryPayload {
  country: string;
}

export function useUpdateMyCountry() {
  return useMutation({
    mutationFn: async (payload: UpdateMyCountryPayload) => {
      const { data } = await api.put(ENDPOINTS.AUTH.UPDATE_USER, payload);
      return data;
    },
  });
}

// Persist the shopper's billing info on the User row. Checkout's billing
// modal writes here; the user dashboard's profile page uses the same hook.
export interface UpdateMyProfilePayload {
  // The backend DTO requires `id` in the body — the route itself is not
  // scoped by JWT yet. Callers can omit this; the hook fills it in from
  // the auth store so no call-site has to remember.
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  profileImage?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export function useUpdateMyProfile() {
  const { setUser, user } = useAuthStore();
  return useMutation({
    mutationFn: async (payload: UpdateMyProfilePayload) => {
      const body: UpdateMyProfilePayload = {
        id: payload.id ?? user?.id,
        ...payload,
      };
      const { data } = await api.put(ENDPOINTS.AUTH.UPDATE_USER, body);
      return data;
    },
    onSuccess: (data: any) => {
      // The NestJS ResponseInterceptor wraps every payload as
      // `{ success, message, data }`, so the fresh user sits at
      // `data.data` — not `data.user` (which the legacy shape used).
      // Merge with the current in-store user so fields the server omits
      // (e.g. token) aren't wiped. This is what lets the header avatar +
      // name + profile image refresh the moment a save succeeds.
      const next = data?.data ?? data?.user ?? null;
      if (next) {
        setUser({ ...(user ?? ({} as any)), ...next });
      } else if (user) {
        setUser({ ...user });
      }
    },
  });
}
