"use client";

import React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { WalletSection } from "@/components/user/WalletSection";
import { JyotishSubNav } from "@/components/user/JyotishSubNav";

export default function WalletPage() {
  return (
    <div>
      <JyotishSubNav />
      <PageHeader
        title="Wallet"
        description="View your balance and transaction history"
      />
      <WalletSection />
    </div>
  );
}
