"use client";

import React from "react";
import { DefaultPage } from "@/components/layout/DefaultPage";
import { PrivateRoute } from "@/components/shared/PrivateRoute";
import { PageHeader } from "@/components/shared/PageHeader";
import { OrderHistory } from "@/components/user/OrderHistory";

export default function OrdersPage() {
  return (
    <DefaultPage>
      <PrivateRoute>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <PageHeader
            title="My Orders"
            description="Track and manage all your orders"
          />
          <OrderHistory />
        </div>
      </PrivateRoute>
    </DefaultPage>
  );
}
