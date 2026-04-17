"use client";

import React from "react";
import { DefaultPage } from "@/components/layout/DefaultPage";
import { PrivateRoute } from "@/components/shared/PrivateRoute";
import { PageHeader } from "@/components/shared/PageHeader";
import { AddressManager } from "@/components/user/AddressManager";

export default function AddressesPage() {
  return (
    <DefaultPage>
      <PrivateRoute>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <PageHeader
            title="My Addresses"
            description="Manage your saved delivery addresses"
          />
          <AddressManager />
        </div>
      </PrivateRoute>
    </DefaultPage>
  );
}
