"use client";

import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useJyotishLogin } from "@/services/jyotish/auth";
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { APP_NAME } from "@/config/constants";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

const loginSchema = Yup.object({
  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function LoginJyotishPage() {
  const router = useRouter();
  const loginMutation = useJyotishLogin();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: loginSchema,
    onSubmit: (values) => {
      loginMutation.mutate(values, {
        onSuccess: (res: any) => {
          // Backend wraps every response in `{ success, data }`, and the
          // astrologer login payload is `{ token, astrologer }`. Store
          // the token under `jyotish_token` (the dashboard layout guard
          // reads this key) AND hydrate the auth store so the dashboard
          // can greet the astrologer by name.
          const inner = res?.data ?? res ?? {};
          const token: string | undefined = inner?.token ?? res?.token;
          const astro = inner?.astrologer ?? inner;
          if (!token) {
            // Defensive: if the backend didn't mint a token, fall through
            // to the login page instead of silently routing to a guarded
            // dashboard that will bounce us right back.
            return;
          }
          localStorage.setItem("jyotish_token", token);
          setAuth(
            {
              id: astro?.id ?? 0,
              name:
                astro?.displayName ||
                astro?.fullName ||
                astro?.name ||
                "Astrologer",
              email: astro?.email ?? values.email,
              role: "ASTROLOGER" as any,
              avatar: astro?.profile?.image ?? undefined,
            } as any,
            token,
          );
          router.push(ROUTES.JYOTISH.DASHBOARD);
        },
      });
    },
  });

  return (
    <div className="jyotish-dark min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--jy-bg-primary)] relative overflow-hidden">
      {/* Decorative stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-[twinkle_3s_ease-in-out_infinite]"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animationDelay: Math.random() * 3 + "s",
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--jy-accent-gold)] to-[var(--jy-accent-gold-dark)] shadow-lg shadow-[var(--jy-accent-gold)]/20">
            <Sparkles className="h-8 w-8 text-[var(--jy-bg-primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--jy-text-primary)] sm:text-3xl">
            {APP_NAME} Jyotish
          </h1>
          <p className="mt-2 text-sm text-[var(--jy-text-secondary)]">
            Astrologer Login
          </p>
        </div>

        {/* Login Card */}
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: "var(--jy-bg-card)",
            border: "1px solid var(--jy-bg-card-border)",
            backdropFilter: "blur(20px)",
          }}
        >
          <form onSubmit={formik.handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="jy-email"
                className="mb-1.5 block text-sm font-medium text-[var(--jy-text-secondary)]"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[var(--jy-text-muted)]" />
                <input
                  id="jy-email"
                  name="email"
                  type="email"
                  placeholder="astrologer@example.com"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  autoComplete="email"
                  className={cn(
                    "w-full rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all duration-200",
                    "bg-white/5 text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-faint)]",
                    "border",
                    formik.touched.email && formik.errors.email
                      ? "border-red-500 focus:ring-2 focus:ring-red-500/30"
                      : "border-[var(--jy-bg-card-border)] focus:border-[var(--jy-accent-gold)] focus:ring-2 focus:ring-[var(--jy-accent-gold)]/20"
                  )}
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-xs text-red-400">{formik.errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="jy-password"
                className="mb-1.5 block text-sm font-medium text-[var(--jy-text-secondary)]"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[var(--jy-text-muted)]" />
                <input
                  id="jy-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  autoComplete="current-password"
                  className={cn(
                    "w-full rounded-xl py-3 pl-11 pr-11 text-sm outline-none transition-all duration-200",
                    "bg-white/5 text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-faint)]",
                    "border",
                    formik.touched.password && formik.errors.password
                      ? "border-red-500 focus:ring-2 focus:ring-red-500/30"
                      : "border-[var(--jy-bg-card-border)] focus:border-[var(--jy-accent-gold)] focus:ring-2 focus:ring-[var(--jy-accent-gold)]/20"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--jy-text-muted)] hover:text-[var(--jy-text-secondary)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-xs text-red-400">{formik.errors.password}</p>
              )}
            </div>

            {/* Forgot Password — routes to the jyotish-themed 3-step
                reset flow so the astrologer never sees wizard chrome
                mid-auth. */}
            <div className="flex justify-end">
              <Link
                href={ROUTES.RESET_PASSWORD_JYOTISH}
                className="text-sm font-medium text-[var(--jy-accent-gold)] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className={cn(
                "relative flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-200",
                "bg-gradient-to-r from-[var(--jy-accent-gold)] to-[var(--jy-accent-gold-dark)] text-[var(--jy-bg-primary)]",
                loginMutation.isPending
                  ? "opacity-80"
                  : "hover:opacity-90 hover:shadow-lg hover:shadow-[var(--jy-accent-gold)]/20 active:scale-[0.98]"
              )}
            >
              {loginMutation.isPending && (
                <Loader2 size={18} className="animate-spin" />
              )}
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--jy-bg-card-border)]" />
            <span className="text-xs text-[var(--jy-text-muted)] uppercase tracking-wider">
              or
            </span>
            <div className="h-px flex-1 bg-[var(--jy-bg-card-border)]" />
          </div>

          {/* Register link */}
          <div className="text-center space-y-3">
            <Link
              href={ROUTES.REGISTER_JYOTISH}
              className="block w-full rounded-xl border border-[var(--jy-accent-purple)]/30 py-3 text-sm font-semibold text-[var(--jy-accent-purple-light)] hover:bg-[var(--jy-accent-purple)]/10 transition-all"
            >
              Register as Astrologer
            </Link>
            <Link
              href={ROUTES.HOME}
              className="inline-block text-sm text-[var(--jy-text-muted)] hover:text-[var(--jy-text-secondary)] transition-colors"
            >
              Back to Mall
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
