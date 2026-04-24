"use client";

import {
  useJyotishForgotPassword,
  useJyotishVerifyForgotOtp,
  useJyotishResetPassword,
} from "@/services/jyotish/auth";
import { ForgotPasswordFlow } from "@/components/auth/ForgotPasswordFlow";
import { ROUTES } from "@/config/routes";

/**
 * Astrologer-facing reset-password page. Same 3-step flow as the
 * shopper reset, just pointed at the `/jyotish/astrologer/*` reset
 * endpoints and dressed in the jyotish purple / gold theme. Login
 * link routes back to the jyotish login so astrologers don't get
 * bounced to the wizard sign-in.
 */
export default function ResetPasswordJyotishPage() {
  const requestOtp = useJyotishForgotPassword();
  const verifyOtp = useJyotishVerifyForgotOtp();
  const resetPassword = useJyotishResetPassword();

  return (
    <ForgotPasswordFlow
      variant="jyotish"
      loginHref={ROUTES.LOGIN_JYOTISH}
      requestOtp={requestOtp}
      verifyOtp={verifyOtp}
      resetPassword={resetPassword}
    />
  );
}
