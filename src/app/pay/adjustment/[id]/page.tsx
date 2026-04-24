"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { useQuery } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { IndianRupee, ShieldCheck, ExternalLink, XCircle } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Payment landing page for an order adjustment. When the admin raises
 * an additional charge we email the customer + copy this URL to the
 * admin's clipboard. This page explains what they're paying, fetches
 * the latest status, and will POST to the PayU checkout once the
 * gateway integration is wired (tracked as the "Backend PayU" todo).
 *
 * For now we render a safe "awaiting gateway" state — the email's
 * call-to-action won't 404, and the customer can see the amount +
 * reason they were told about.
 */
export default function AdjustmentPaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = params?.id;
  const id =
    typeof rawId === "string"
      ? rawId
      : Array.isArray(rawId)
        ? rawId[0]
        : undefined;
  const callbackStatus = searchParams.get("status");
  const [launching, setLaunching] = useState(false);

  const handlePay = async () => {
    if (!id || launching) return;
    setLaunching(true);
    try {
      const { data } = await api.post<{
        success: boolean;
        data: {
          gateway: string;
          actionUrl: string;
          params: Record<string, string>;
        };
      }>(`${ENDPOINTS.PAYMENTS.ADJUSTMENTS}/${id}/initiate-payu`);
      const launch = data?.data;
      if (!launch?.actionUrl || !launch?.params) {
        toast.error("Couldn't start the payment — please try again.");
        setLaunching(false);
        return;
      }
      const form = document.createElement("form");
      form.method = "POST";
      form.action = launch.actionUrl;
      for (const [name, value] of Object.entries(launch.params)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = String(value ?? "");
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
      // browser is navigating away — keep launching state true so the
      // button stays disabled until the redirect actually happens
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ??
          "Couldn't start the payment — please try again.",
      );
      setLaunching(false);
    }
  };

  // We load the full order adjustments list to find this specific row.
  // A dedicated /order-adjustments/:id endpoint would be tidier, but the
  // current admin listing takes an orderId query only — going through
  // it is cheaper than adding a new route. Once the gateway wiring lands
  // we'll switch this to a direct fetch.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["adjustment", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<any>(
        `${ENDPOINTS.PAYMENTS.ADJUSTMENTS}/by-id/${id}`,
      );
      return data?.data ?? null;
    },
    retry: false,
  });

  const adjustment = (data ?? null) as Record<string, any> | null;
  const money = (n: number | null | undefined) =>
    `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <PageHeader
        title="Additional payment"
        description="Complete the extra amount requested by our team."
      />

      {isLoading && (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      )}

      {isError && (
        <div className="mt-6 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            We couldn&apos;t load this payment request.
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            The link may have expired. Please check your email for an updated
            link, or reach out to support.
          </p>
        </div>
      )}

      {!isLoading && !isError && adjustment && (
        <div className="mt-6 space-y-4">
          {/* Amount card */}
          <div className="rounded-2xl border border-[var(--border-primary)] bg-gradient-to-br from-[var(--accent-primary)]/10 to-transparent p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Amount due
            </p>
            <p className="mt-2 flex items-center gap-2 text-4xl font-bold text-[var(--text-primary)]">
              <IndianRupee className="h-7 w-7 text-[var(--accent-primary)]" />
              {money(adjustment.amount)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <Badge
                variant={
                  adjustment.status === "PAID"
                    ? "success"
                    : adjustment.status === "CANCELLED"
                      ? "danger"
                      : "warning"
                }
              >
                {adjustment.status}
              </Badge>
              <span className="text-[var(--text-muted)]">
                Type: {adjustment.adjustmentType}
              </span>
              {adjustment.paymentTxnId && (
                <span className="font-mono text-[var(--text-muted)]">
                  Ref: {adjustment.paymentTxnId}
                </span>
              )}
            </div>
          </div>

          {adjustment.reason && (
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Reason
              </p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">
                {adjustment.reason}
              </p>
            </div>
          )}

          {/* Callback banner — shown when PayU redirects the shopper
              back to this page with ?status=failure after a failed or
              cancelled attempt. Success redirects set ?status=success
              but the backend also updates the row, so we primarily
              look at `adjustment.status` below for the source of truth. */}
          {callbackStatus === "failure" && adjustment.status !== "PAID" && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-200">
              <p className="flex items-center gap-2 font-semibold">
                <XCircle className="h-4 w-4" /> Previous attempt failed
              </p>
              <p className="mt-1 text-xs">
                The last payment didn&apos;t go through. You can retry below
                — if any money was debited it will be refunded automatically
                within 5-7 working days.
              </p>
            </div>
          )}

          {/* State-based CTA */}
          {adjustment.status === "PAID" ? (
            <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-800 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300">
              <p className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4" /> Payment received
              </p>
              <p className="mt-1 text-xs">
                Thanks! This request was already paid. No further action is
                needed.
              </p>
            </div>
          ) : adjustment.status === "CANCELLED" ? (
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 text-sm text-[var(--text-secondary)]">
              This payment request has been cancelled by the admin.
            </div>
          ) : (
            <Button
              fullWidth
              leftIcon={<IndianRupee className="h-4 w-4" />}
              onClick={handlePay}
              loading={launching}
            >
              Proceed to pay {`₹${Number(adjustment.amount ?? 0).toLocaleString("en-IN")}`}
            </Button>
          )}

          <div className="flex justify-center">
            <Link href="/dashboard/orders">
              <Button variant="outline" leftIcon={<ExternalLink className="h-4 w-4" />}>
                Go to my orders
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
