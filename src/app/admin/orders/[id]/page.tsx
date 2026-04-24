"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { OrderDetailBody } from "@/components/admin/orders/OrderDetailBody";
import {
  useAdminOrder,
  useAdminUpdateOrder,
  useCreateOrderAdjustment,
} from "@/services/admin/orders";
import {
  ChevronLeft,
  ChevronDown,
  Printer,
  Pencil,
  IndianRupee,
  Send,
  Check,
  FileText,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
  "COMPLETED",
  "REFUND",
];

const ADJUSTMENT_TYPES = [
  "SHIPPING",
  "ITEM_ADD",
  "ITEM_SHIPPING",
  "NETWORK_FEE",
  "TAX",
  "DISCOUNT",
  "PENALTY",
  "MANUAL",
];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : undefined;
  const numericId = id ? Number(id) : undefined;

  const { data, isLoading } = useAdminOrder(id);
  const order = (data ?? null) as Record<string, any> | null;

  const updateMutation = useAdminUpdateOrder();
  const adjustmentMutation = useCreateOrderAdjustment();

  // Edit-inline state — no modal, so admin can see the order below while
  // editing status/tracking on the right sidebar.
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [trackingLink, setTrackingLink] = useState<string>("");

  // Request-additional-payment form state (reason + type + amount).
  const [adjType, setAdjType] =
    useState<(typeof ADJUSTMENT_TYPES)[number]>("SHIPPING");
  const [adjAmount, setAdjAmount] = useState<string>("");
  const [adjReason, setAdjReason] = useState<string>("");
  // Collapsed by default — admin expands only when raising a charge.
  const [adjFormOpen, setAdjFormOpen] = useState(false);

  // Print mode toggles the body into packing-slip form and fires the
  // browser print dialog. Restored to false when the dialog closes so
  // admins can click Print repeatedly.
  const [printMode, setPrintMode] = useState(false);

  const handlePrint = () => {
    setPrintMode(true);
    // Let the render commit before the browser print dialog captures
    // the DOM, otherwise it may print pre-toggle state.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
        setTimeout(() => setPrintMode(false), 200);
      });
    });
  };

  const handleStartEdit = () => {
    if (!order) return;
    setStatus((order.status as string) ?? "PENDING");
    setTrackingLink((order.trackingLink as string) ?? "");
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!numericId) return;
    await updateMutation.mutateAsync({
      id: numericId,
      status: status as any,
      trackingLink: trackingLink.trim() || undefined,
    });
    setEditing(false);
  };

  const handleRequestAdditional = async () => {
    if (!numericId) return;
    const amount = Number(adjAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!adjReason.trim()) {
      toast.error("Enter a reason for the customer");
      return;
    }
    const response = await adjustmentMutation.mutateAsync({
      orderId: numericId,
      adjustmentType: adjType,
      impact: "DEBIT",
      amount,
      reason: adjReason.trim(),
      isManual: true,
    });
    // Surface the payment link right away so the admin doesn't have to
    // scroll down to the adjustments table — they can copy + verify or
    // share over another channel. The full row still renders below
    // after the refetch.
    const url: string | undefined = (response as any)?.data?.paymentUrl;
    if (url && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Payment request sent + link copied to clipboard");
    }
    setAdjAmount("");
    setAdjReason("");
  };

  const sourceLabel = useMemo(() => {
    const raw = String(order?.orderBy ?? "").toLowerCase();
    if (raw === "quickgo" || raw === "hecate-quickgo") return "QuickGo";
    if (raw === "jyotish") return "Jyotish";
    if (raw === "wizard" || raw === "website" || raw === "") return "Wizard Mall";
    return raw;
  }, [order?.orderBy]);

  if (isLoading || !order) {
    return (
      <div className="space-y-3 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className={printMode ? "print-mode" : ""}>
      {/* Print-only stylesheet. Isolates the `.print-area` block so the
          admin shell (sidebar / topbar / notifications / chat widget)
          doesn't bleed into the packing slip. */}
      <style jsx global>{`
        @media print {
          /* Hide the entire app shell. Only the .print-area subtree is
             unhidden below, keeping the packing slip free of sidebar,
             topbar, chat widgets and other app chrome. */
          body * {
            visibility: hidden !important;
          }
          .print-area,
          .print-area * {
            visibility: visible !important;
          }
          /* Pin the print area to fill the printable page width so the
             3-column address row actually has room to span side-by-side.
             Using left+right rather than width:100% guarantees it. */
          .print-area {
            position: absolute !important;
            left: 0;
            right: 0;
            top: 0;
            padding: 0 8mm !important;
            background: white !important;
            color: black !important;
          }
          /* Force the customer / billing / shipping row into 3 columns
             in print regardless of the md: breakpoint. Tight gap so they
             read as a packing-slip header band. */
          .print-area .address-grid {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 6mm !important;
          }
          /* Compact the section chrome: no rounded shadows on paper. */
          .print-area section {
            border: 1px solid #d0d0d0 !important;
            border-radius: 4px !important;
            padding: 8px 10px !important;
            margin-bottom: 6mm !important;
            background: white !important;
          }
          /* Defensive: chat widgets, toasts and floating helpers. */
          .no-print,
          [data-no-print],
          .Toastify,
          [class*="crisp"],
          [class*="intercom"],
          [class*="fixed"][class*="bottom"],
          [class*="fixed"][class*="right"] {
            display: none !important;
          }
          /* Let big sections break across pages so we don't waste the
             bottom of page 1 when the items list is long. Individual
             item rows still refuse to split (handled below). */
          .print-mode section {
            break-inside: auto;
            page-break-inside: auto;
          }
          .print-mode .order-item-row {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          /* Compact table look on paper. */
          .print-area .order-items-print th,
          .print-area .order-items-print td {
            padding: 4px 6px !important;
            vertical-align: top;
          }
          .print-area .order-items-print thead tr {
            border-bottom: 1px solid #888 !important;
          }
          .print-area .order-items-print tbody tr {
            border-bottom: 1px solid #e5e5e5 !important;
          }
          @page {
            margin: 10mm;
            size: auto;
          }
        }
      `}</style>

      {/* Top bar */}
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-lg font-bold text-[var(--text-primary)] sm:text-xl">
                {order.orderNumber ?? `Order #${order.id}`}
              </h1>
              <Badge variant="info">{sourceLabel}</Badge>
              <Badge
                variant={
                  order.status === "DELIVERED"
                    ? "success"
                    : order.status === "CANCELLED"
                      ? "danger"
                      : "warning"
                }
              >
                {order.status ?? "PENDING"}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Placed{" "}
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString("en-IN")
                : "—"}
              {order.invoiceNumber && (
                <>
                  {" • "}
                  <span className="font-medium text-[var(--text-secondary)]">
                    Invoice {order.invoiceNumber}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="h-4 w-4" />}
            onClick={handlePrint}
            title="In the print dialog, turn OFF 'Headers and footers' for a clean packing slip"
          >
            Print packing slip
          </Button>
          {!editing ? (
            <Button
              size="sm"
              leftIcon={<Pencil className="h-4 w-4" />}
              onClick={handleStartEdit}
            >
              Edit order
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                leftIcon={<Check className="h-4 w-4" />}
                loading={updateMutation.isPending}
                onClick={handleSaveEdit}
              >
                Save changes
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main order body (2/3 on desktop). `print-area` class isolates
            this subtree when window.print() fires — see the @media print
            block above. */}
        <div className="print-area lg:col-span-2">
          {/* Print-only header. Gives the packing slip a branded top
              instead of starting mid-flow. Hidden on screen (only shown
              in the print stylesheet below). */}
          <div
            className="hidden"
            style={{ display: printMode ? "block" : undefined }}
          >
            <div className="mb-4 border-b border-gray-300 pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-lg font-bold">Hecate</h1>
                  <p className="text-xs text-gray-600">
                    Packing slip
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold">
                    {order.orderNumber ?? `Order #${order.id}`}
                  </p>
                  <p className="text-[11px] text-gray-600">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                  </p>
                  {order.invoiceNumber && (
                    <p className="text-[11px] text-gray-600">
                      Invoice {order.invoiceNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <OrderDetailBody
            order={order}
            variant="admin"
            printMode={printMode}
            // Customer note + adjustments list live in the right sidebar
            // (below Quick links). Keeps the main column focused on
            // items + pricing while operational info stays near the
            // action forms.
            hideSidebarSections={!printMode}
          />
        </div>

        {/* Right sidebar: admin actions (hidden in print) */}
        <aside className="no-print space-y-4">
          {editing && (
            <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
              <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                Status &amp; tracking
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Tracking link"
                  value={trackingLink}
                  onChange={(e) => setTrackingLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </section>
          )}

          {/* Collapsible "Request additional payment" form. Closed by
              default so the sidebar stays compact — admins only expand
              it when they actually need to raise an adjustment. State
              lives at page level so typing in the amount/reason doesn't
              get lost if they collapse mid-edit. */}
          <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
            <button
              type="button"
              onClick={() => setAdjFormOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
              aria-expanded={adjFormOpen}
            >
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Request additional payment
                </h3>
                {!adjFormOpen && (
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Click to raise a new adjustment.
                  </p>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[var(--text-muted)] transition-transform",
                  adjFormOpen && "rotate-180",
                )}
              />
            </button>
            {adjFormOpen && (
              <div className="border-t border-[var(--border-primary)] px-4 pb-4 pt-3">
                <p className="mb-3 text-xs text-[var(--text-muted)]">
                  Creates an order adjustment visible on the customer&apos;s
                  dashboard. An email with a payment link is sent to the
                  customer automatically.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                      Type
                    </label>
                    <select
                      value={adjType}
                      onChange={(e) => setAdjType(e.target.value as any)}
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                    >
                      {ADJUSTMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Amount"
                    type="number"
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    placeholder="0"
                    leftIcon={<IndianRupee className="h-4 w-4" />}
                  />
                  <Textarea
                    label="Reason (shown to customer)"
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. International shipping correction"
                  />
                  <Button
                    fullWidth
                    leftIcon={<Send className="h-4 w-4" />}
                    loading={adjustmentMutation.isPending}
                    onClick={handleRequestAdditional}
                  >
                    Send payment request
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
            <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
              Quick links
            </h3>
            <div className="space-y-1">
              <Link
                href="/admin/orders"
                className="block rounded-md px-2 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              >
                ← Back to orders list
              </Link>
              {order.userId && (
                <Link
                  href={`/admin/users/${order.userId}`}
                  className="block rounded-md px-2 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                >
                  View customer profile
                </Link>
              )}
            </div>
          </section>

          {/* Customer note — pulled out of the main body so admin can
              see it while editing status / sending payment requests. */}
          {order.note && (
            <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <FileText className="h-3.5 w-3.5" />
                Customer note
              </h3>
              <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
                {order.note}
              </p>
            </section>
          )}

          {/* Existing adjustments list. Stays close to the
              "Request additional payment" form so admin can verify the
              previous row landed correctly before creating another. */}
          {Array.isArray(order.adjustments) && order.adjustments.length > 0 && (
            <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <AlertCircle className="h-3.5 w-3.5" />
                Additional payment requests ({order.adjustments.length})
              </h3>
              <div className="space-y-2">
                {order.adjustments.map((a: any) => {
                  const showPayLink =
                    a.paymentUrl &&
                    a.impact !== "CREDIT" &&
                    a.status !== "PAID" &&
                    a.status !== "CANCELLED";
                  const symbol = (order.currencySymbol as string) ?? "₹";
                  return (
                    <div
                      key={a.id}
                      className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[var(--text-primary)]">
                            {a.reason ?? a.adjustmentType}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            {a.adjustmentType} · {a.impact}
                          </p>
                          {a.paymentTxnId && (
                            <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                              {a.paymentTxnId}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold">
                            {symbol}
                            {Number(a.amount).toLocaleString("en-IN")}
                          </p>
                          <Badge
                            variant={
                              a.status === "PAID"
                                ? "success"
                                : a.status === "CANCELLED"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {a.status}
                          </Badge>
                        </div>
                      </div>
                      {showPayLink && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-amber-200 pt-2 text-[10px] dark:border-amber-800">
                          <a
                            href={a.paymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all font-mono text-indigo-600 underline hover:text-indigo-700 dark:text-indigo-300"
                          >
                            {a.paymentUrl}
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                typeof navigator !== "undefined" &&
                                navigator.clipboard
                              ) {
                                navigator.clipboard.writeText(a.paymentUrl);
                                toast.success("Link copied");
                              }
                            }}
                            className="rounded-md border border-amber-300 px-2 py-0.5 font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40"
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
