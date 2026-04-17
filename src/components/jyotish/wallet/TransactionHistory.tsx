"use client";

import React from "react";
import { useAstrologerTransactions } from "@/services/jyotish/wallet";

const typeColors: Record<string, string> = {
  credit: "text-green-400",
  debit: "text-red-400",
  withdrawal: "text-orange-400",
  refund: "text-blue-400",
};

export function TransactionHistory() {
  const { data, isLoading } = useAstrologerTransactions({ page: 1, limit: 20 });
  const transactions = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl shimmer" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-12 text-center">
        <p className="text-sm text-[var(--text-muted)]">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Date
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Description
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Type
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-primary)]">
          {transactions.map((tx: any) => (
            <tr key={tx._id || tx.id} className="hover:bg-[var(--bg-card-hover)]">
              <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">
                {tx.createdAt
                  ? new Date(tx.createdAt).toLocaleDateString()
                  : "-"}
              </td>
              <td className="px-4 py-3 text-[var(--text-primary)]">
                {tx.description || tx.reason || "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 capitalize text-[var(--text-secondary)]">
                {tx.type || "-"}
              </td>
              <td
                className={`whitespace-nowrap px-4 py-3 text-right font-medium ${
                  typeColors[tx.type] || "text-[var(--text-primary)]"
                }`}
              >
                {tx.type === "credit" || tx.type === "refund" ? "+" : "-"}
                &#8377;{Math.abs(tx.amount ?? 0).toLocaleString("en-IN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionHistory;
