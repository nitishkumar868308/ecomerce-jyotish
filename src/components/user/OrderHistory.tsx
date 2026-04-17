"use client";

import React, { useState } from "react";
import { useOrders } from "@/services/orders";
import { OrderDetail } from "./OrderDetail";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400",
};

export function OrderHistory() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrders({ page, limit: 10 });
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const orders = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (selectedOrder) {
    return (
      <OrderDetail
        orderId={selectedOrder}
        onBack={() => setSelectedOrder(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl shimmer" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-16 text-center">
        <p className="text-lg font-semibold text-[var(--text-primary)]">
          No orders yet
        </p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Your orders will appear here once you make a purchase
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {orders.map((order: any) => {
          const id = order._id || order.id;
          return (
            <button
              key={id}
              onClick={() => setSelectedOrder(String(id))}
              className="flex w-full items-center justify-between rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-5 py-4 text-left transition-colors hover:bg-[var(--bg-card-hover)]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Order #{String(id).slice(-8)}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : ""}
                  {order.items && ` \u2022 ${order.items.length} item(s)`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  &#8377;{order.total?.toLocaleString("en-IN") ?? 0}
                </p>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    statusColors[order.status] || statusColors.pending
                  }`}
                >
                  {order.status || "pending"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-[var(--border-primary)] px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--text-muted)]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-[var(--border-primary)] px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
