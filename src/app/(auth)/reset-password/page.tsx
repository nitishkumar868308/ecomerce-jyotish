"use client";

import {
  useForgotPassword,
  useVerifyForgotOtp,
  useResetPassword,
} from "@/services/auth";
import { ForgotPasswordFlow } from "@/components/auth/ForgotPasswordFlow";
import { ROUTES } from "@/config/routes";

/**
 * Shopper-facing reset-password page. Wraps the shared 3-step flow
 * (email → OTP → new password) with the Wizard theme + the regular
 * auth service mutation hooks. The equivalent astrologer page lives at
 * /reset-password-jyotish and just swaps the hook trio.
 */
export default function ResetPasswordPage() {
  const requestOtp = useForgotPassword();
  const verifyOtp = useVerifyForgotOtp();
  const resetPassword = useResetPassword();
  // Adapter: underlying hook signature differs slightly between
  // shopper + astrologer; the shopper reset takes `token` while the
  // flow component standardises on `otp`. We normalise here.
  const resetAdapter = {
    ...resetPassword,
    mutateAsync: (v: { email: string; otp: string; password: string }) =>
      resetPassword.mutateAsync({
        email: v.email,
        token: v.otp,
        password: v.password,
      }),
  } as any;

  return (
    <ForgotPasswordFlow
      variant="wizard"
      loginHref={ROUTES.HOME}
      requestOtp={requestOtp}
      verifyOtp={verifyOtp}
      resetPassword={resetAdapter}
    />
  );
}
