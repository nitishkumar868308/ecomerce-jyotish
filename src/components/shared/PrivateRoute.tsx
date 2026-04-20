"use client";

import Link from "next/link";
import { Lock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import { ROUTES } from "@/config/routes";
import type { UserRole } from "@/types/user";
import type { ReactNode } from "react";
import { Loader } from "@/components/ui/Loader";

interface PrivateRouteProps {
  children: ReactNode;
  /** Legacy single-role check. Prefer `allowedRoles`. */
  requiredRole?: UserRole;
  /** Roles permitted to view the subtree. If omitted, any logged-in user passes. */
  allowedRoles?: UserRole[];
}

export function PrivateRoute({ children, requiredRole, allowedRoles }: PrivateRouteProps) {
  const { isLoggedIn, user, hasHydrated } = useAuthStore();

  // Wait for persist hydration so refresh doesn't flash "unauthorized".
  if (!hasHydrated) {
    return <HydratingFallback />;
  }

  if (!isLoggedIn) {
    return <LoginRequired />;
  }

  const roles = allowedRoles ?? (requiredRole ? [requiredRole] : undefined);
  if (roles && (!user || !roles.includes(user.role))) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

export default PrivateRoute;

/* -------------------------------------------------- */
/*  States                                            */
/* -------------------------------------------------- */

function HydratingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader variant="section" />
    </div>
  );
}

function LoginRequired() {
  const openModal = useUIStore((s) => s.openModal);

  return (
    <Shell
      icon={<Lock className="h-7 w-7 text-[var(--accent-primary)]" />}
      iconBg="bg-[var(--accent-primary-light,rgba(99,102,241,0.12))]"
      title="Login required"
      description="You need to be logged in to view this page."
      primary={
        <button
          type="button"
          onClick={() => openModal("auth")}
          className="rounded-lg bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          Sign in
        </button>
      }
      secondary={
        <Link
          href={ROUTES.HOME}
          className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          Back to home
        </Link>
      }
    />
  );
}

function AccessDenied() {
  return (
    <Shell
      icon={<ShieldAlert className="h-7 w-7 text-red-600" />}
      iconBg="bg-red-100"
      title="Unauthorized"
      description="You do not have permission to access this page."
      primary={
        <Link
          href={ROUTES.HOME}
          className="rounded-lg bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          Back to home
        </Link>
      }
    />
  );
}

function Shell({
  icon,
  iconBg,
  title,
  description,
  primary,
  secondary,
}: {
  icon: ReactNode;
  iconBg: string;
  title: string;
  description: string;
  primary: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center",
      )}
    >
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-full", iconBg)}>
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="max-w-sm text-sm text-[var(--text-muted)]">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {primary}
        {secondary}
      </div>
    </div>
  );
}
