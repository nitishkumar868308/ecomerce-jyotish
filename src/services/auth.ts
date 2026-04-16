import { useMutation, useQuery } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { User, LoginPayload, RegisterPayload, AuthResponse } from "@/types/user";
import type { ApiResponse } from "@/types/api";
import toast from "react-hot-toast";

export function useMe() {
  const { isLoggedIn, setUser } = useAuthStore();
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<User>>(ENDPOINTS.AUTH.ME);
      setUser(data.data);
      return data.data;
    },
    enabled: isLoggedIn,
    staleTime: 0,
  });
}

export function useLogin() {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await api.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, payload);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast.success("Login successful!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Login failed");
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await api.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER, payload);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast.success("Registration successful!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Registration failed");
    },
  });
}

export function useGoogleLogin() {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: async (credential: string) => {
      const { data } = await api.post<AuthResponse>(ENDPOINTS.AUTH.GOOGLE, { credential });
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast.success("Login successful!");
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
    onSuccess: () => {
      toast.success("Password reset email sent!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send reset email");
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: { token: string; password: string }) => {
      const { data } = await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Password reset successful!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Reset failed");
    },
  });
}
