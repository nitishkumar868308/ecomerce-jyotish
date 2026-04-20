"use client";

import React from "react";
import DefaultPage from "@/components/layout/DefaultPage";
import { QuickGoLandingModal } from "@/components/store/quickgo/QuickGoLandingModal";

export default function HecateQuickGoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="quickgo-theme">
      <DefaultPage>{children}</DefaultPage>
      {/* Mount at the layout level so every QuickGo page gets the city/pincode
          onboarding once and a persistent "change location" pill after. */}
      <QuickGoLandingModal />
    </div>
  );
}
