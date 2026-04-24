"use client";

import React from "react";
import DefaultPage from "@/components/layout/DefaultPage";
import { QuickGoLandingModal } from "@/components/store/quickgo/QuickGoLandingModal";
import { QuickGoCountryGate } from "@/components/store/quickgo/QuickGoCountryGate";

export default function HecateQuickGoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="quickgo-theme">
      <DefaultPage>
        {/* QuickGo is India-only. If the shopper's storefront country is
            not India (either via the topbar switch on wizard or a direct
            URL hit from abroad), swap the page body for a friendly
            not-available splash instead of rendering QuickGo routes. */}
        <QuickGoCountryGate>{children}</QuickGoCountryGate>
      </DefaultPage>
      {/* Mount at the layout level so every QuickGo page gets the city/pincode
          onboarding once and a persistent "change location" pill after. */}
      <QuickGoLandingModal />
    </div>
  );
}
