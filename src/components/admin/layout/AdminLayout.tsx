"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/useUIStore";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="admin-theme min-h-screen bg-[var(--bg-secondary)]">
      <AdminSidebar />
      <AdminHeader />

      <main
        className={cn(
          "min-h-screen pt-[60px] transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64",
        )}
      >
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
