"use client";

import Link from "next/link";
import { useWalletBalance, useWalletTransactions } from "@/services/wallet";
import { usePrice } from "@/hooks/usePrice";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus } from "lucide-react";

export function WalletSection() {
  const { data: balance, isLoading: balLoading } = useWalletBalance();
  const { data: txData, isLoading: txLoading } = useWalletTransactions({});
  const { format } = usePrice();

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card padding="lg" className="relative overflow-hidden border-0 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)]">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Wallet className="h-6 w-6 text-white/80" />
              <span className="text-sm font-medium text-white/80">
                Wallet Balance
              </span>
            </div>
            {balLoading ? (
              <Skeleton className="h-10 w-40 bg-white/20" />
            ) : (
              <p className="text-3xl font-bold text-white">
                {format(balance?.balance || 0)}
              </p>
            )}
          </div>
          <Link
            href="/dashboard/wallet/add-money"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[var(--accent-primary)] shadow-sm transition-transform hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" /> Add Money
          </Link>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </Card>

      {/* Transactions */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Transaction History
        </h3>
        {txLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : !txData?.data?.length ? (
          <EmptyState icon={Wallet} title="No transactions" description="Your wallet transaction history will appear here." />
        ) : (
          <div className="space-y-2">
            {txData.data.map((tx: any) => (
              <div key={tx.id} className="flex items-center gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tx.type === "CREDIT" ? "bg-[var(--accent-success-light)]" : "bg-[var(--accent-danger-light)]"}`}>
                  {tx.type === "CREDIT" ? (
                    <ArrowDownLeft className="h-5 w-5 text-[var(--accent-success)]" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5 text-[var(--accent-danger)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{tx.note || (tx.type === "CREDIT" ? "Money credited" : "Money debited")}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatDate(tx.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.type === "CREDIT" ? "text-[var(--accent-success)]" : "text-[var(--accent-danger)]"}`}>
                    {tx.type === "CREDIT" ? "+" : "-"}{format(tx.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WalletSection;
