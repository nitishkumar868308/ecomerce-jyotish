"use client";

import AdminLayout from "@/components/admin/layout/AdminLayout";
import { PrivateRoute } from "@/components/shared/PrivateRoute";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivateRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
      <AdminLayout>{children}</AdminLayout>
    </PrivateRoute>
  );
}
