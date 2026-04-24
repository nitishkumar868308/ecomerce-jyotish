"use client";

import React, { useState } from "react";
import { useMyOrders } from "@/services/orders";
import { useAuthStore } from "@/stores/useAuthStore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { OrderDetailModal } from "./OrderDetailModal";
import { ExternalLink, Eye, Package, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<
  string,
  { label: string; variant: "default" | "info" | "warning" | "success" | "danger" }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  PROCESSING: { label: "Processing", variant: "info" },
  SHIPPED: { label: "Shipped", variant: "info" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
  FAILED: { label: "Failed", variant: "danger" },
  COMPLETED: { label: "Completed", variant: "success" },
  REFUND: { label: "Refunded", variant: "default" },
};

const SOURCE_LABEL: Record<string, { label: string; cls: string }> = {
  wizard: {
    label: "Wizard Mall",
    cls: "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]",
  },
  website: {
    label: "Wizard Mall",
    cls: "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]",
  },
  quickgo: { label: "QuickGo", cls: "bg-amber-100 text-amber-700" },
  "hecate-quickgo": { label: "QuickGo", cls: "bg-amber-100 text-amber-700" },
  jyotish: { label: "Jyotish", cls: "bg-purple-100 text-purple-700" },
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatMoney(amount: number | null | undefined, symbol?: string) {
  const n = Number(amount ?? 0);
  return `${symbol ?? "₹"}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function OrderHistory() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyOrders(user?.id, { page, limit: 10 });
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const orders = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (isLoading) {
    return (
      <div className="mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-16">
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="When you place an order it'll show up here with track + view options."
        />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="space-y-3">
        {orders.map((order) => {
          const o = order as unknown as Record<string, any>;
          const source = String(o.orderBy ?? "wizard").toLowerCase();
          const sourceCfg = SOURCE_LABEL[source] ?? SOURCE_LABEL.wizard;
          const statusCfg =
            STATUS_VARIANT[String(o.status ?? "PENDING").toUpperCase()] ??
            STATUS_VARIANT.PENDING;
          const trackingLink = o.trackingLink as string | undefined;
          const total = Number(o.totalAmount ?? 0);
          const symbol = (o.currencySymbol as string) ?? "₹";
          const itemCount = Array.isArray(o.orderItems)
            ? o.orderItems.length
            : 0;

          return (
            <div
              key={o.id}
              className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 transition-shadow hover:shadow-sm sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: order identity */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                      {o.orderNumber ?? `Order #${o.id}`}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        sourceCfg.cls,
                      )}
                    >
                      {sourceCfg.label}
                    </span>
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </span>
                    <span>•</span>
                    <span>Placed on {formatDate(o.createdAt)}</span>
                    {o.paymentStatus === "PAID" && o.invoiceNumber && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-[var(--text-secondary)]">
                          Invoice {o.invoiceNumber}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: total + actions */}
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {formatMoney(total, symbol)}
                  </p>
                  <div className="flex gap-2">
                    {trackingLink ? (
                      <a
                        href={trackingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
                        >
                          Track
                        </Button>
                      </a>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
                        title="Tracking link not available yet"
                      >
                        Track
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => setSelectedOrderId(o.id)}
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-[var(--text-muted)]">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}

export default OrderHistory;
