"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

export function AuthProvider({ children }: { children: ReactNode }) {
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [logout]);

  return <>{children}</>;
}
