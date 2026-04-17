"use client";

import React from "react";
import { DefaultPage } from "@/components/layout/DefaultPage";
import { PrivateRoute } from "@/components/shared/PrivateRoute";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProfileSection } from "@/components/user/ProfileSection";

export default function ProfilePage() {
  return (
    <DefaultPage>
      <PrivateRoute>
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <PageHeader
            title="My Profile"
            description="Update your personal information"
          />
          <ProfileSection />
        </div>
      </PrivateRoute>
    </DefaultPage>
  );
}
