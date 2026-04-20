"use client";

import { DefaultPage } from "@/components/layout/DefaultPage";
import { PrivateRoute } from "@/components/shared/PrivateRoute";

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DefaultPage>
      <PrivateRoute allowedRoles={["USER"]}>{children}</PrivateRoute>
    </DefaultPage>
  );
}
