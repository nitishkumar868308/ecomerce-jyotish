"use client";

import React from "react";
import { useOrder, useTrackOrder } from "@/services/orders";

interface OrderDetailProps {
  orderId: string;
  onBack: () => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

export function OrderDetail({ orderId, onBack }: OrderDetailProps) {
  const { data: order, isLoading } = useOrder(orderId);
  const { data: tracking } = useTrackOrder(orderId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 rounded shimmer" />
        <div className="h-40 rounded-xl shimmer" />
        <div className="h-32 rounded-xl shimmer" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center">
        <p className="text-sm text-[var(--text-muted)]">Order not found</p>
        <button onClick={onBack} className="mt-2 text-sm text-[var(--accent-primary)] underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Orders
      </button>

      {/* Order header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Order #{String(orderId).slice(-8)}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Placed on{" "}
            {order.createdAt
              ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "--"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
            statusColors[order.status] || statusColors.pending
          }`}
        >
          {order.status || "pending"}
        </span>
      </div>

      {/* Items */}
      <div className="mb-6 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
        <h3 className="border-b border-[var(--border-primary)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)]">
          Items ({(order as any).items?.length ?? 0})
        </h3>
        <div className="divide-y divide-[var(--border-primary)]">
          {((order as any).items ?? []).map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-14 w-14 rounded-lg border border-[var(--border-primary)] object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {item.name || item.productName || "Product"}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Qty: {item.quantity ?? 1}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-[var(--text-primary)]">
                &#8377;{(item.price ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Order Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Subtotal</span>
            <span>&#8377;{((order as any).subtotal ?? (order as any).total ?? 0).toLocaleString("en-IN")}</span>
          </div>
          {(order as any).shipping != null && (
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Shipping</span>
              <span>&#8377;{(order as any).shipping.toLocaleString("en-IN")}</span>
            </div>
          )}
          {(order as any).discount != null && (order as any).discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-&#8377;{(order as any).discount.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-[var(--border-primary)] pt-2 font-semibold">
            <span>Total</span>
            <span>&#8377;{((order as any).total ?? 0).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Tracking */}
      {tracking && (tracking as any).steps && (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
            Tracking
          </h3>
          <div className="space-y-4">
            {((tracking as any).steps ?? []).map((step: any, i: number) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      step.completed
                        ? "bg-[var(--accent-primary)]"
                        : "border-2 border-[var(--border-primary)]"
                    }`}
                  />
                  {i < (tracking as any).steps.length - 1 && (
                    <div className="w-px flex-1 bg-[var(--border-primary)]" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {step.title}
                  </p>
                  {step.date && (
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(step.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
