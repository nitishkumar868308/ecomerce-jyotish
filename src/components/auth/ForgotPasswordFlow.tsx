"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseMutationResult } from "@tanstack/react-query";

/**
 * 3-step password reset flow shared by Wizard shoppers and Jyotish
 * astrologers. The host page wires in the right mutation hooks + theme;
 * everything here (validation, step transitions, toasts, loaders, OTP
 * countdown) stays identical so shoppers get the same shape of
 * experience on both surfaces.
 */
export interface ForgotPasswordFlowProps {
  /** Visual theme: shifts colours + copy labels. Logic is identical. */
  variant: "wizard" | "jyotish";
  /** Where the "Back to login" link points — /login for wizard etc. */
  loginHref: string;
  /** Mutation that posts the email and triggers an OTP email. */
  requestOtp: UseMutationResult<any, any, string, unknown>;
  /** Mutation that verifies the OTP without consuming it. */
  verifyOtp: UseMutationResult<any, any, { email: string; otp: string }, unknown>;
  /** Mutation that consumes the OTP + writes the new password hash. */
  resetPassword: UseMutationResult<
    any,
    any,
    { email: string; otp: string; password: string },
    unknown
  >;
}

type Step = "email" | "otp" | "password" | "done";

export function ForgotPasswordFlow({
  variant,
  loginHref,
  requestOtp,
  verifyOtp,
  resetPassword,
}: ForgotPasswordFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Magic-link fast-path: when the reset email's CTA sent the shopper
  // here with `?email=…&otp=…`, verify the code once on mount and, on
  // success, jump straight to the "new password" step. On failure we
  // fall back to the regular email step so they can request a fresh
  // code. Ref + localRef guards so React StrictMode's double-mount
  // doesn't double-verify.
  const autoVerifiedRef = useRef(false);
  useEffect(() => {
    if (autoVerifiedRef.current) return;
    const urlEmail = searchParams?.get("email");
    const urlOtp = searchParams?.get("otp");
    if (!urlEmail || !urlOtp) return;
    autoVerifiedRef.current = true;
    setEmail(urlEmail);
    setOtp(urlOtp);
    verifyOtp
      .mutateAsync({ email: urlEmail, otp: urlOtp })
      .then(() => setStep("password"))
      .catch(() => {
        // Likely expired / already used — drop them at the email step
        // with the field prefilled so resend is one click.
        setStep("email");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Countdown for resend. Starts whenever we successfully request (or
  // re-request) an OTP. Seconds left; 0 = resend enabled.
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (secondsLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secondsLeft]);

  // Theme tokens for the two variants so the rest of the JSX stays
  // variant-agnostic.
  const theme =
    variant === "jyotish"
      ? {
          label: "Hecate Jyotish",
          brandColor: "text-[var(--jy-accent-gold)]",
          bg: "bg-[var(--jy-bg-primary)]",
          cardBg: "bg-[var(--jy-bg-card)] border-[var(--jy-bg-card-border)]",
          textPrimary: "text-[var(--jy-text-primary)]",
          textSecondary: "text-[var(--jy-text-secondary)]",
          textMuted: "text-[var(--jy-text-muted)]",
          textFaint: "text-[var(--jy-text-faint)]",
          inputBg: "bg-white/5",
          inputBorder: "border-[var(--jy-bg-card-border)]",
          inputFocus: "focus:border-[var(--jy-accent-gold)] focus:ring-[var(--jy-accent-gold)]/20",
          button:
            "bg-gradient-to-r from-[var(--jy-accent-gold)] to-[var(--jy-accent-gold-dark)] text-[var(--jy-bg-primary)] hover:opacity-95",
          stepActive: "bg-[var(--jy-accent-gold)] text-[var(--jy-bg-primary)]",
          stepDone: "bg-[var(--jy-accent-gold)]/20 text-[var(--jy-accent-gold)]",
          stepIdle: "bg-white/5 text-[var(--jy-text-muted)]",
          linkColor: "text-[var(--jy-accent-gold)]",
          successBg: "bg-[var(--jy-accent-gold)]/10 border-[var(--jy-accent-gold)]/30",
          successIconColor: "text-[var(--jy-accent-gold)]",
        }
      : {
          label: "Hecate Wizard Mall",
          brandColor: "text-[var(--accent-primary)]",
          bg: "bg-[var(--bg-primary)]",
          cardBg: "bg-[var(--bg-card)] border-[var(--border-primary)]",
          textPrimary: "text-[var(--text-primary)]",
          textSecondary: "text-[var(--text-secondary)]",
          textMuted: "text-[var(--text-muted)]",
          textFaint: "text-[var(--text-faint)]",
          inputBg: "bg-[var(--bg-primary)]",
          inputBorder: "border-[var(--border-primary)]",
          inputFocus: "focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/20",
          button:
            "bg-gradient-to-r from-[var(--accent-primary)] to-emerald-600 text-white hover:opacity-95",
          stepActive: "bg-[var(--accent-primary)] text-white",
          stepDone: "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]",
          stepIdle: "bg-[var(--bg-secondary)] text-[var(--text-muted)]",
          linkColor: "text-[var(--accent-primary)]",
          successBg: "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30",
          successIconColor: "text-[var(--accent-primary)]",
        };

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const otpOk = /^\d{6}$/.test(otp.trim());
  const passwordOk = password.length >= 6 && password === confirm;

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOk) return;
    try {
      await requestOtp.mutateAsync(email.trim());
      toast.success("OTP sent to your email.");
      setStep("otp");
      setSecondsLeft(60);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not send OTP.");
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpOk) return;
    try {
      await verifyOtp.mutateAsync({ email: email.trim(), otp: otp.trim() });
      toast.success("Code verified.");
      setStep("password");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid or expired code.");
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordOk) return;
    try {
      await resetPassword.mutateAsync({
        email: email.trim(),
        otp: otp.trim(),
        password,
      });
      toast.success("Password updated — sign in with your new password.");
      setStep("done");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not reset password.");
    }
  };

  const resendOtp = async () => {
    if (secondsLeft > 0) return;
    try {
      await requestOtp.mutateAsync(email.trim());
      toast.success("New OTP sent.");
      setSecondsLeft(60);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not resend code.");
    }
  };

  return (
    <div className={cn("min-h-screen", theme.bg)}>
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px]">
          <div className="mb-6 text-center">
            <p
              className={cn(
                "text-[11px] font-bold uppercase tracking-[3px]",
                theme.brandColor,
              )}
            >
              {theme.label}
            </p>
            <h1 className={cn("mt-2 text-2xl font-bold", theme.textPrimary)}>
              Reset your password
            </h1>
            <p className={cn("mt-1 text-sm", theme.textSecondary)}>
              We&rsquo;ll email you a one-time code to verify it&rsquo;s you.
            </p>
          </div>

          <StepDots step={step} theme={theme} />

          <div
            className={cn(
              "mt-5 rounded-2xl border p-6 shadow-[0_4px_14px_rgba(0,0,0,0.04)] sm:p-7",
              theme.cardBg,
            )}
          >
            {step === "email" && (
              <form onSubmit={submitEmail} className="space-y-4">
                <FieldLabel theme={theme}>Registered email</FieldLabel>
                <InputIcon
                  theme={theme}
                  icon={<Mail className="h-4 w-4" />}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <PrimaryButton
                  theme={theme}
                  disabled={!emailOk || requestOtp.isPending}
                  loading={requestOtp.isPending}
                >
                  Send code
                  {!requestOtp.isPending && (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </PrimaryButton>
                <BottomLink theme={theme} loginHref={loginHref} />
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={submitOtp} className="space-y-4">
                <p className={cn("text-xs", theme.textMuted)}>
                  We sent a 6-digit code to{" "}
                  <span className={theme.textPrimary}>{email}</span>. It&rsquo;s
                  valid for 15 minutes.
                </p>
                <FieldLabel theme={theme}>Verification code</FieldLabel>
                <InputIcon
                  theme={theme}
                  icon={<KeyRound className="h-4 w-4" />}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  mono
                />
                <PrimaryButton
                  theme={theme}
                  disabled={!otpOk || verifyOtp.isPending}
                  loading={verifyOtp.isPending}
                >
                  Verify code
                  {!verifyOtp.isPending && <ArrowRight className="h-4 w-4" />}
                </PrimaryButton>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className={cn(
                      "inline-flex items-center gap-1 font-medium",
                      theme.textMuted,
                      "hover:" + theme.textPrimary.replace("text-", "text-"),
                    )}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={secondsLeft > 0 || requestOtp.isPending}
                    className={cn(
                      "font-semibold",
                      theme.linkColor,
                      (secondsLeft > 0 || requestOtp.isPending) &&
                        "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {secondsLeft > 0
                      ? `Resend in ${secondsLeft}s`
                      : "Resend code"}
                  </button>
                </div>
                <BottomLink theme={theme} loginHref={loginHref} />
              </form>
            )}

            {step === "password" && (
              <form onSubmit={submitReset} className="space-y-4">
                <FieldLabel theme={theme}>New password</FieldLabel>
                <InputIcon
                  theme={theme}
                  icon={<Lock className="h-4 w-4" />}
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className={cn("p-1", theme.textMuted)}
                      tabIndex={-1}
                    >
                      {showPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
                <FieldLabel theme={theme}>Confirm new password</FieldLabel>
                <InputIcon
                  theme={theme}
                  icon={<Lock className="h-4 w-4" />}
                  type={showPass ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  invalid={!!confirm && confirm !== password}
                />
                {!!confirm && confirm !== password && (
                  <p className="-mt-2 text-[11px] text-red-500">
                    Passwords don&rsquo;t match.
                  </p>
                )}
                <PrimaryButton
                  theme={theme}
                  disabled={!passwordOk || resetPassword.isPending}
                  loading={resetPassword.isPending}
                >
                  Update password
                </PrimaryButton>
                <BottomLink theme={theme} loginHref={loginHref} />
              </form>
            )}

            {step === "done" && (
              <div className="space-y-4 text-center">
                <div
                  className={cn(
                    "mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border",
                    theme.successBg,
                  )}
                >
                  <CheckCircle2
                    className={cn("h-7 w-7", theme.successIconColor)}
                  />
                </div>
                <div>
                  <h2
                    className={cn("text-lg font-semibold", theme.textPrimary)}
                  >
                    Password updated
                  </h2>
                  <p className={cn("mt-1 text-sm", theme.textSecondary)}>
                    You can now sign in with your new password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(loginHref)}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
                    theme.button,
                  )}
                >
                  Go to sign in
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────── tiny presentational helpers ────────────── */

type Theme = ReturnType<() => {
  brandColor: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  button: string;
  stepActive: string;
  stepDone: string;
  stepIdle: string;
  linkColor: string;
}>;

function StepDots({
  step,
  theme,
}: {
  step: Step;
  theme: { stepActive: string; stepDone: string; stepIdle: string };
}) {
  const order: Step[] = ["email", "otp", "password", "done"];
  const currentIdx = order.indexOf(step);
  const labels = ["Email", "Code", "New password"];
  return (
    <ol className="flex items-center justify-between gap-2 px-1">
      {labels.map((lbl, i) => {
        const state =
          i < currentIdx ? "done" : i === currentIdx ? "active" : "idle";
        const klass =
          state === "active"
            ? theme.stepActive
            : state === "done"
              ? theme.stepDone
              : theme.stepIdle;
        return (
          <li key={lbl} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                klass,
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn(
                "hidden text-[11px] font-medium sm:block",
                state === "active"
                  ? "text-[var(--accent-primary)] dark:text-[var(--jy-accent-gold)]"
                  : "text-[var(--text-muted)] dark:text-[var(--jy-text-muted)]",
              )}
            >
              {lbl}
            </span>
            {i < labels.length - 1 && (
              <div
                className={cn(
                  "hidden h-px flex-1 sm:block",
                  state === "done"
                    ? "bg-[var(--accent-primary)]/60 dark:bg-[var(--jy-accent-gold)]/60"
                    : "bg-[var(--border-primary)] dark:bg-white/10",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function FieldLabel({
  theme,
  children,
}: {
  theme: { textSecondary: string };
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn("mb-1.5 block text-sm font-medium", theme.textSecondary)}
    >
      {children}
    </span>
  );
}

function InputIcon({
  theme,
  icon,
  trailing,
  invalid,
  mono,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  theme: {
    textMuted: string;
    textFaint: string;
    inputBg: string;
    inputBorder: string;
    inputFocus: string;
    textPrimary: string;
  };
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  invalid?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="relative">
      <span
        className={cn(
          "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2",
          theme.textMuted,
        )}
      >
        {icon}
      </span>
      <input
        {...rest}
        className={cn(
          "w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none transition-colors",
          theme.inputBg,
          theme.inputBorder,
          theme.textPrimary,
          "placeholder:" + theme.textFaint.replace("text-", "text-"),
          "focus:ring-2",
          theme.inputFocus,
          invalid && "border-red-500 focus:ring-red-500/30",
          mono && "font-mono tracking-[0.35em] text-center text-base",
          trailing ? "pr-11" : "pr-4",
        )}
      />
      {trailing && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {trailing}
        </span>
      )}
    </div>
  );
}

function PrimaryButton({
  theme,
  loading,
  disabled,
  children,
}: {
  theme: { button: string };
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(
        "relative flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
        theme.button,
        (disabled || loading) && "opacity-70 cursor-not-allowed",
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

function BottomLink({
  theme,
  loginHref,
}: {
  theme: { textMuted: string; linkColor: string };
  loginHref: string;
}) {
  return (
    <p className={cn("pt-2 text-center text-xs", theme.textMuted)}>
      Remembered your password?{" "}
      <a
        href={loginHref}
        className={cn("font-semibold hover:underline", theme.linkColor)}
      >
        Back to sign in
      </a>
    </p>
  );
}

export default ForgotPasswordFlow;
