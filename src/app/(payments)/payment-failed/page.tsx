"use client";

import React, { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle, RotateCcw, Home, Zap } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

/**
 * Themed post-payment failure page. Same routing contract as the
 * success page — PayU's webhook redirects here with
 * `?order_id={orderNumber}&platform=wizard|quickgo` after a failed or
 * cancelled payment. The order is already flipped to FAILED server-side,
 * we just show the shopper what to do next.
 */
export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
          <Skeleton className="h-48 w-full max-w-md rounded-2xl" />
        </div>
      }
    >
      <PaymentFailedInner />
    </Suspense>
  );
}

function PaymentFailedInner() {
  const sp = useSearchParams();
  const orderId = sp.get("order_id");
  const platform = (sp.get("platform") ?? "wizard").toLowerCase();
  const reason = sp.get("reason"); // "cancelled" | "failed" | null
  const isQuickGo = platform === "quickgo" || platform === "hecate-quickgo";
  const isCancelled = reason === "cancelled";

  // Reconcile with PayU on mount. The PayU-hosted cancel page doesn't
  // reliably POST back to our `/payu/failure` webhook (especially if
  // the shopper closed the tab after hitting Cancel), so the order
  // could still be stuck in PENDING. This call asks PayU what the
  // source-of-truth status is and updates our DB. Fire-and-forget —
  // we don't block the UI on the response.
  const syncedRef = useRef(false);
  useEffect(() => {
    if (!orderId || syncedRef.current) return;
    syncedRef.current = true;
    api.post(`/payu/sync/${encodeURIComponent(orderId)}`).catch(() => {
      // Best-effort. If PayU is unreachable or the order is already
      // reconciled, the retry button still works from the UI.
    });
  }, [orderId]);

  const theme = isQuickGo
    ? {
        iconWrap: "bg-rose-100 text-rose-600",
        badge: "bg-amber-500/15 text-amber-700",
        label: "QuickGo",
        retryHref: "/hecate-quickgo/checkout",
        homeHref: "/hecate-quickgo/home",
      }
    : {
        iconWrap: "bg-[var(--accent-danger-light)] text-[var(--accent-danger)]",
        badge: "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]",
        label: "Wizard Mall",
        retryHref: ROUTES.CHECKOUT,
        homeHref: ROUTES.HOME,
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
              <XCircle className="h-10 w-10" />
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
            {isCancelled ? "Payment cancelled" : "Payment failed"}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {isCancelled
              ? "Looks like you stepped away from the payment page. Your order is still saved — you can retry whenever you're ready."
              : "We couldn't complete this payment. If your bank shows the amount debited, it will be reversed automatically within 5-7 working days. You can retry the order now."}
          </p>

          {orderId && (
            <p className="mt-5 font-mono text-xs text-[var(--text-muted)]">
              Order {orderId}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={theme.retryHref}>
              <Button leftIcon={<RotateCcw className="h-4 w-4" />}>
                Try again
              </Button>
            </Link>
            <Link href={theme.homeHref}>
              <Button variant="outline" leftIcon={<Home className="h-4 w-4" />}>
                Go home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
