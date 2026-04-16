"use client";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type { UserRole } from "@/types/user";
import type { ReactNode } from "react";

interface PrivateRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export function PrivateRoute({ children, requiredRole }: PrivateRouteProps) {
  const { isLoggedIn, user } = useAuthStore();

  if (!isLoggedIn) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 py-16 text-center"
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-7 w-7 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Unauthorized
        </h3>
        <p className="max-w-sm text-sm text-[var(--text-muted)]">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default PrivateRoute;
