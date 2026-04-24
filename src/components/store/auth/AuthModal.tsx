"use client";

import { useState, useEffect, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { X, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/useUIStore";
import { useLogin, useRegister, useForgotPassword, useGoogleLogin } from "@/services/auth";
import { API_CONFIG } from "@/lib/api";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { AuthResponse } from "@/types/user";

type AuthView = "login" | "register" | "forgot-password";

const loginSchema = Yup.object({
  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

const registerSchema = Yup.object({
  name: Yup.string().min(2, "Name must be at least 2 characters").required("Name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

const forgotPasswordSchema = Yup.object({
  email: Yup.string().email("Invalid email address").required("Email is required"),
});

export default function AuthModal() {
  const { activeModal, closeModal } = useUIStore();
  const isOpen = activeModal === "auth";
  const router = useRouter();

  const [view, setView] = useState<AuthView>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const forgotPasswordMutation = useForgotPassword();
  const googleLoginMutation = useGoogleLogin();

  // Route admins to the admin panel after auth; regular users stay put.
  const redirectByRole = (data: AuthResponse) => {
    const role = data.user?.role;
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      router.push(ROUTES.ADMIN.DASHBOARD);
    }
  };

  // Animation mount
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setMounted(true));
    } else {
      setMounted(false);
      // Reset state when modal closes
      setTimeout(() => {
        setView("login");
        setShowPassword(false);
      }, 200);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeModal]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Google login callback
  const handleGoogleCallback = useCallback(
    (response: { credential: string }) => {
      if (response.credential) {
        googleLoginMutation.mutate(response.credential, {
          onSuccess: (data) => {
            redirectByRole(data);
            closeModal();
          },
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [googleLoginMutation, closeModal]
  );

  // Initialize Google Sign-In
  useEffect(() => {
    if (!isOpen || !API_CONFIG.GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (typeof window !== "undefined" && (window as any).google?.accounts) {
        (window as any).google.accounts.id.initialize({
          client_id: API_CONFIG.GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
        const googleBtn = document.getElementById("google-signin-btn");
        if (googleBtn) {
          (window as any).google.accounts.id.renderButton(googleBtn, {
            theme: "outline",
            size: "large",
            width: "100%",
            shape: "pill",
            text: "continue_with",
          });
        }
      }
    };

    // Check if script already loaded
    if ((window as any).google?.accounts) {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    }
  }, [isOpen, view, handleGoogleCallback]);

  // Login form
  const loginForm = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: loginSchema,
    onSubmit: (values) => {
      loginMutation.mutate(values, {
        onSuccess: (data) => {
          redirectByRole(data);
          closeModal();
          loginForm.resetForm();
        },
      });
    },
  });

  // Register form
  const registerForm = useFormik({
    initialValues: { name: "", email: "", password: "", confirmPassword: "" },
    validationSchema: registerSchema,
    onSubmit: (values) => {
      // Backend rejects unknown fields — send only what the API accepts.
      const { confirmPassword: _confirmPassword, ...payload } = values;
      registerMutation.mutate(payload, {
        onSuccess: (data) => {
          redirectByRole(data);
          closeModal();
          registerForm.resetForm();
        },
      });
    },
  });

  // Forgot password form
  const forgotForm = useFormik({
    initialValues: { email: "" },
    validationSchema: forgotPasswordSchema,
    onSubmit: (values) => {
      forgotPasswordMutation.mutate(values.email, {
        onSuccess: () => {
          forgotForm.resetForm();
        },
      });
    },
  });

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeModal();
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300",
        mounted ? "opacity-100" : "opacity-0"
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Authentication"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-[440px] max-h-[90vh] overflow-y-auto rounded-2xl transition-all duration-300",
          mounted ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        )}
        style={{
          backgroundColor: "var(--bg-primary)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
          border: "1px solid var(--border-primary)",
        }}
      >
        {/* Decorative gradient bar */}
        <div
          className="h-1 w-full"
          style={{
            background: "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))",
          }}
        />

        {/* Close button */}
        <button
          onClick={closeModal}
          className="absolute right-4 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
          style={{
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-muted)",
          }}
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
          {/* Header */}
          {view === "forgot-password" ? (
            <div className="mb-6">
              <button
                onClick={() => setView("login")}
                className="mb-3 flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
                style={{ color: "var(--accent-primary)" }}
              >
                <ArrowLeft size={14} />
                Back to login
              </button>
              <h2
                className="text-2xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Reset Password
              </h2>
              <p
                className="mt-1 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Enter your email and we'll send you a reset link
              </p>
            </div>
          ) : (
            <>
              {/* Logo / Brand */}
              <div className="mb-6 text-center">
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                  }}
                >
                  <Sparkles size={24} className="text-white" />
                </div>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {view === "login" ? "Welcome Back" : "Create Account"}
                </h2>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  {view === "login"
                    ? "Sign in to continue shopping"
                    : "Join us for an amazing experience"}
                </p>
              </div>

              {/* Tabs */}
              <div
                className="mb-6 flex rounded-xl p-1"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                {(["login", "register"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setView(tab);
                      setShowPassword(false);
                    }}
                    className={cn(
                      "flex-1 rounded-lg py-2.5 text-sm font-semibold capitalize transition-all duration-200"
                    )}
                    style={{
                      backgroundColor: view === tab ? "var(--bg-primary)" : "transparent",
                      color: view === tab ? "var(--text-primary)" : "var(--text-muted)",
                      boxShadow: view === tab ? "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))" : "none",
                    }}
                  >
                    {tab === "login" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Google Sign-In */}
          {view !== "forgot-password" && API_CONFIG.GOOGLE_CLIENT_ID && (
            <>
              <div id="google-signin-btn" className="mb-4 flex justify-center [&>div]:!w-full" />
              <div className="relative mb-4">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div
                    className="w-full border-t"
                    style={{ borderColor: "var(--border-primary)" }}
                  />
                </div>
                <div className="relative flex justify-center">
                  <span
                    className="px-3 text-xs uppercase tracking-wider"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-muted)",
                    }}
                  >
                    or
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Login Form */}
          {view === "login" && (
            <form onSubmit={loginForm.handleSubmit} className="space-y-4" noValidate>
              <InputField
                id="login-email"
                name="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                icon={<Mail size={18} />}
                formik={loginForm}
              />
              <InputField
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="Enter your password"
                icon={<Lock size={18} />}
                formik={loginForm}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="transition-colors duration-200"
                    style={{ color: "var(--text-muted)" }}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <div className="flex justify-end">
                {/* The full reset flow (email → OTP → new password) lives
                    on /reset-password as a dedicated page so the modal
                    doesn't have to juggle three separate forms. Close
                    the modal cleanly before navigating so the backdrop
                    transition doesn't fight with the route change. */}
                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    router.push(ROUTES.RESET_PASSWORD);
                  }}
                  className="text-sm font-medium transition-colors duration-200 hover:underline"
                  style={{ color: "var(--accent-primary)" }}
                >
                  Forgot Password?
                </button>
              </div>

              <SubmitButton loading={loginMutation.isPending} label="Sign In" />
            </form>
          )}

          {/* Register Form */}
          {view === "register" && (
            <form onSubmit={registerForm.handleSubmit} className="space-y-4" noValidate>
              <InputField
                id="register-name"
                name="name"
                type="text"
                label="Full Name"
                placeholder="John Doe"
                icon={<User size={18} />}
                formik={registerForm}
              />
              <InputField
                id="register-email"
                name="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                icon={<Mail size={18} />}
                formik={registerForm}
              />
              <InputField
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="Min 6 characters"
                icon={<Lock size={18} />}
                formik={registerForm}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="transition-colors duration-200"
                    style={{ color: "var(--text-muted)" }}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              <InputField
                id="register-confirm-password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                label="Confirm Password"
                placeholder="Re-enter your password"
                icon={<Lock size={18} />}
                formik={registerForm}
              />

              <SubmitButton loading={registerMutation.isPending} label="Create Account" />
            </form>
          )}

          {/* Forgot Password Form */}
          {view === "forgot-password" && (
            <form onSubmit={forgotForm.handleSubmit} className="space-y-4" noValidate>
              <InputField
                id="forgot-email"
                name="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                icon={<Mail size={18} />}
                formik={forgotForm}
              />
              <SubmitButton
                loading={forgotPasswordMutation.isPending}
                label="Send Reset Link"
              />
            </form>
          )}

          {/* Footer - Astrologer login */}
          {view !== "forgot-password" && (
            <div className="mt-6 text-center">
              <div
                className="h-px w-full"
                style={{ backgroundColor: "var(--border-primary)" }}
              />
              <Link
                href={ROUTES.LOGIN_JYOTISH}
                onClick={closeModal}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-200 hover:underline"
                style={{ color: "var(--accent-secondary, var(--accent-primary))" }}
              >
                <Sparkles size={14} />
                Login as Astrologer
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable sub-components                                           */
/* ------------------------------------------------------------------ */

interface InputFieldProps {
  id: string;
  name: string;
  type: string;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  formik: any;
  suffix?: React.ReactNode;
}

function InputField({ id, name, type, label, placeholder, icon, formik, suffix }: InputFieldProps) {
  const touched = formik.touched[name];
  const error = formik.errors[name];
  const hasError = touched && error;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        {label}
      </label>
      <div className="relative">
        <div
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: hasError ? "var(--error, #EF4444)" : "var(--text-muted)" }}
        >
          {icon}
        </div>
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          autoComplete={
            type === "password"
              ? "current-password"
              : type === "email"
                ? "email"
                : type === "tel"
                  ? "tel"
                  : "off"
          }
          className={cn(
            "w-full rounded-xl py-3 pl-11 text-sm outline-none transition-all duration-200",
            suffix ? "pr-11" : "pr-4"
          )}
          style={{
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            border: hasError
              ? "1.5px solid var(--error, #EF4444)"
              : "1.5px solid transparent",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = hasError
              ? "var(--error, #EF4444)"
              : "var(--accent-primary)";
            e.target.style.boxShadow = hasError
              ? "0 0 0 3px rgba(239, 68, 68, 0.1)"
              : "0 0 0 3px var(--accent-primary-light, rgba(99, 102, 241, 0.1))";
          }}
          onBlurCapture={(e) => {
            e.target.style.borderColor = hasError
              ? "var(--error, #EF4444)"
              : "transparent";
            e.target.style.boxShadow = "none";
          }}
        />
        {suffix && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
      {hasError && (
        <p
          className="mt-1 text-xs"
          style={{ color: "var(--error, #EF4444)" }}
        >
          {error as string}
        </p>
      )}
    </div>
  );
}

interface SubmitButtonProps {
  loading: boolean;
  label: string;
}

function SubmitButton({ loading, label }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={cn(
        "relative flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200",
        loading ? "opacity-80" : "hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
      )}
      style={{
        background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary, var(--accent-primary-hover)))",
      }}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {label}
    </button>
  );
}
