"use client";

import React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { WalletSection } from "@/components/user/WalletSection";

export default function WalletPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Wallet"
        description="View your balance and transaction history"
      />
      <WalletSection />
    </div>
  );
}
