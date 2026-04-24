import { useMutation } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import toast from "react-hot-toast";

export function useJyotishRegister() {
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      [key: string]: any;
    }) => {
      const { data } = await api.post(ENDPOINTS.JYOTISH.REGISTER, payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Registration successful!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Registration failed");
    },
  });
}

export function useJyotishLogin() {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const { data } = await api.post(ENDPOINTS.JYOTISH.LOGIN, payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Login successful!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Login failed");
    },
  });
}

/* ─── Astrologer forgot-password flow (mirrors the shopper flow) ─── */

export function useJyotishForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post("/jyotish/astrologer/forgot-password", {
        email,
      });
      return data;
    },
  });
}

export function useJyotishVerifyForgotOtp() {
  return useMutation({
    mutationFn: async (payload: { email: string; otp: string }) => {
      const { data } = await api.post(
        "/jyotish/astrologer/verify-forgot-otp",
        payload,
      );
      return data;
    },
  });
}

export function useJyotishResetPassword() {
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      otp: string;
      password: string;
    }) => {
      const { data } = await api.post(
        "/jyotish/astrologer/reset-password",
        payload,
      );
      return data;
    },
  });
}
