"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Package, Home, FileText, Zap } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { api, ENDPOINTS } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Themed post-payment success page. PayU's callback on our backend
 * redirects here with `?order_id={orderNumber}&platform=wizard|quickgo`;
 * we look up the order to show invoice + total and style the page in the
 * storefront's palette the shopper came from (QuickGo = amber, Wizard =
 * primary indigo).
 */
export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
          <Skeleton className="h-48 w-full max-w-md rounded-2xl" />
        </div>
      }
    >
      <PaymentSuccessInner />
    </Suspense>
  );
}

function PaymentSuccessInner() {
  const sp = useSearchParams();
  const orderId = sp.get("order_id");
  const platform = (sp.get("platform") ?? "wizard").toLowerCase();
  const isQuickGo = platform === "quickgo" || platform === "hecate-quickgo";

  const { data: order, isLoading } = useQuery({
    queryKey: ["order-by-number", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      // Lookup by orderNumber through the tracker endpoint — no auth
      // required so users who arrive without a session (e.g. a paid
      // guest checkout tab) still see their summary.
      const { data } = await api.get(
        ENDPOINTS.ORDERS.TRACK(orderId as string),
        { params: { orderNumber: orderId } },
      );
      return data?.data ?? null;
    },
    retry: 0,
  });

  // Tailwind classnames differ by tab so the palette matches wherever
  // the shopper came from. The tick + CTA button use the active theme.
  const theme = isQuickGo
    ? {
        iconWrap: "bg-amber-100 text-amber-600",
        accentButton: "bg-amber-500 text-white hover:bg-amber-600",
        badge: "bg-amber-500/15 text-amber-700",
        label: "QuickGo",
      }
    : {
        iconWrap: "bg-emerald-100 text-emerald-600",
        accentButton: "bg-[var(--accent-primary)] text-white",
        badge: "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]",
        label: "Wizard Mall",
      };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="rounded-3xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-8 text-center shadow-sm">
          <div
            className={cn(
              "mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full",
              theme.iconWrap,
            )}
          >
            {isQuickGo ? (
              <Zap className="h-10 w-10" />
            ) : (
              <CheckCircle className="h-10 w-10" />
            )}
          </div>
          <p
            className={cn(
              "mx-auto mb-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              theme.badge,
            )}
          >
            {theme.label}
          </p>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Payment successful!
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Thanks — we&apos;ve received your payment and your order is on its
            way. A confirmation email is being sent to you now.
          </p>

          {isLoading && (
            <div className="mt-6">
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          )}

          {!isLoading && order && (
            <div className="mt-6 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 text-left">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                Order
              </p>
              <p className="font-mono text-sm font-bold text-[var(--text-primary)]">
                {(order as any).orderNumber ?? orderId}
              </p>
              {(order as any).invoiceNumber && (
                <>
                  <p className="mt-3 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                    Invoice
                  </p>
                  <p className="font-mono text-xs text-[var(--text-primary)]">
                    {(order as any).invoiceNumber}
                  </p>
                </>
              )}
            </div>
          )}

          {!isLoading && !order && orderId && (
            <p className="mt-6 font-mono text-xs text-[var(--text-muted)]">
              Order {orderId}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={ROUTES.DASHBOARD_ORDERS}>
              <Button
                leftIcon={<Package className="h-4 w-4" />}
                className={cn(!isQuickGo && "")}
                style={
                  isQuickGo ? { background: "#f59e0b", color: "#fff" } : undefined
                }
              >
                View my orders
              </Button>
            </Link>
            <Link href={isQuickGo ? "/hecate-quickgo/home" : ROUTES.HOME}>
              <Button variant="outline" leftIcon={<Home className="h-4 w-4" />}>
                Continue shopping
              </Button>
            </Link>
          </div>

          <p className="mt-6 flex items-center justify-center gap-1 text-[11px] text-[var(--text-muted)]">
            <FileText className="h-3 w-3" />
            A receipt + invoice will appear on your order detail page.
          </p>
        </div>
      </div>
    </div>
  );
}
