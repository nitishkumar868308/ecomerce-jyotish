"use client";

import React from "react";
import { useAstrologerWallet } from "@/services/jyotish/wallet";

export function WalletBalance() {
  const { data: wallet, isLoading } = useAstrologerWallet();

  if (isLoading) {
    return <div className="h-32 rounded-xl shimmer" />;
  }

  const balance = wallet?.balance ?? 0;

  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-gradient-to-r from-[var(--jy-accent-purple)]/10 to-[var(--jy-accent-gold)]/10 p-6">
      <p className="text-sm font-medium text-[var(--text-muted)]">
        Available Balance
      </p>
      <p className="mt-2 text-3xl font-bold">
        &#8377;{balance.toLocaleString("en-IN")}
      </p>
      <div className="mt-4 flex gap-3">
        <button className="rounded-lg bg-[var(--accent-primary)] px-5 py-2 text-sm font-medium text-white hover:opacity-90">
          Withdraw
        </button>
        <button className="rounded-lg border border-[var(--border-primary)] px-5 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]">
          Add Funds
        </button>
      </div>
    </div>
  );
}

export default WalletBalance;
