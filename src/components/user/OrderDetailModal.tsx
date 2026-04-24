"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { useOrder } from "@/services/orders";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { cn } from "@/lib/utils";
import {
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
  Receipt,
  Heart,
  Truck,
  FileText,
  AlertCircle,
  IndianRupee,
} from "lucide-react";

interface OrderDetailModalProps {
  orderId: number | null;
  onClose: () => void;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function money(amount: number | null | undefined, symbol = "₹") {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return "—";
  return `${symbol}${n.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;
}

const STATUS_VARIANT: Record<
  string,
  "default" | "info" | "warning" | "success" | "danger"
> = {
  PENDING: "warning",
  PROCESSING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  FAILED: "danger",
  COMPLETED: "success",
  REFUND: "default",
  PAID: "success",
};

export function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const { data, isLoading } = useOrder(orderId ?? "");
  const order = (data ?? null) as Record<string, any> | null;
  const symbol = (order?.currencySymbol as string) ?? "₹";
  const items = Array.isArray(order?.orderItems) ? order!.orderItems : [];
  const adjustments = Array.isArray(order?.adjustments)
    ? order!.adjustments
    : [];

  // Discount math is derived from the per-line `savedAmount` so mixed
  // baskets (some items with offer, some without) show a clear single
  // savings line instead of trusting the top-level discount column.
  const offerBulkSavings = items.reduce(
    (s: number, it: any) => s + Number(it.savedAmount ?? 0),
    0,
  );
  const itemsSubtotal = items.reduce(
    (s: number, it: any) =>
      s + Number(it.originalPrice ?? 0) * Number(it.quantity ?? 0),
    0,
  );
  const itemsFinalTotal = itemsSubtotal - offerBulkSavings;
  const shippingCharges = Number(order?.shippingCharges ?? 0);
  const promoDiscount = Number(order?.promoDiscount ?? 0);
  const donationAmount = Number(order?.donationAmount ?? 0);
  const grandTotal = Number(order?.totalAmount ?? 0);

  const pendingAdjustments = adjustments.filter(
    (a: any) => a.status !== "CANCELLED",
  );
  const adjustmentsTotal = pendingAdjustments.reduce(
    (s: number, a: any) => {
      const amt = Number(a.amount ?? 0);
      return s + (a.impact === "CREDIT" ? -amt : amt);
    },
    0,
  );

  return (
    <Modal
      isOpen={!!orderId}
      onClose={onClose}
      size="xl"
      className="max-h-[92vh]"
    >
      {isLoading || !order ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="flex max-h-[88vh] flex-col">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 border-b border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-mono text-base font-bold text-[var(--text-primary)] sm:text-lg">
                    {order.orderNumber ?? `Order #${order.id}`}
                  </h2>
                  <Badge
                    variant={
                      STATUS_VARIANT[String(order.status ?? "PENDING")] ??
                      "warning"
                    }
                  >
                    {String(order.status ?? "PENDING")}
                  </Badge>
                  <Badge
                    variant={
                      STATUS_VARIANT[
                        String(order.paymentStatus ?? "PENDING")
                      ] ?? "warning"
                    }
                  >
                    {String(order.paymentStatus ?? "PENDING")}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Placed {formatDateTime(order.createdAt)}
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
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)]">You paid</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">
                  {money(grandTotal, symbol)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            {/* Customer + Addresses — stacked 3 cards */}
            <div className="grid gap-3 md:grid-cols-3">
              <InfoCard
                title="Customer"
                icon={<User className="h-4 w-4" />}
              >
                <InfoLine label="Name" value={order.userName} />
                <InfoLine label="Email" value={order.userEmail} />
                <InfoLine label="Phone" value={order.userPhone} />
              </InfoCard>

              <InfoCard
                title="Billing address"
                icon={<FileText className="h-4 w-4" />}
              >
                <AddressBlock
                  name={order.billingName}
                  phone={order.billingPhone}
                  address={order.billingAddress}
                  city={order.billingCity}
                  state={order.billingState}
                  pincode={order.billingPincode}
                  country={order.billingCountry}
                />
              </InfoCard>

              <InfoCard
                title="Shipping address"
                icon={<MapPin className="h-4 w-4" />}
              >
                <AddressBlock
                  name={order.shippingName}
                  phone={order.shippingPhone}
                  address={order.shippingAddress}
                  city={order.shippingCity}
                  state={order.shippingState}
                  pincode={order.shippingPincode}
                  country={order.shippingCountry}
                />
              </InfoCard>
            </div>

            {/* Payment */}
            <InfoCard
              title="Payment"
              icon={<CreditCard className="h-4 w-4" />}
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span>
                  <span className="text-[var(--text-muted)]">Method:</span>{" "}
                  <span className="font-medium text-[var(--text-primary)]">
                    {order.paymentMethod ?? "—"}
                  </span>
                </span>
                {order.paymentTxnId && (
                  <span className="text-xs text-[var(--text-muted)]">
                    Txn: {order.paymentTxnId}
                  </span>
                )}
                {order.paymentPaidAt && (
                  <span className="text-xs text-[var(--text-muted)]">
                    Paid on {formatDateTime(order.paymentPaidAt)}
                  </span>
                )}
              </div>
            </InfoCard>

            {/* Order items — proper TABLE format */}
            <InfoCard
              title={`Order items (${items.length})`}
              icon={<ShoppingBag className="h-4 w-4" />}
              noPadding
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                      <th className="w-8 px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">Product</th>
                      <th className="w-32 px-3 py-2 font-medium">Qty</th>
                      <th className="w-28 px-3 py-2 text-right font-medium">
                        Unit
                      </th>
                      <th className="w-28 px-3 py-2 text-right font-medium">
                        Line total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it: any, idx: number) => (
                      <OrderItemTableRow
                        key={it.id}
                        idx={idx + 1}
                        item={it}
                        symbol={symbol}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </InfoCard>

            {/* Pricing breakdown + adjustments side by side on desktop */}
            <div className="grid gap-3 lg:grid-cols-2">
              <InfoCard
                title="Price breakdown"
                icon={<Receipt className="h-4 w-4" />}
              >
                <dl className="space-y-2 text-sm">
                  <Line
                    label="Items subtotal"
                    value={money(itemsSubtotal, symbol)}
                  />
                  {offerBulkSavings > 0 && (
                    <Line
                      label="Offer / bulk savings"
                      value={`- ${money(offerBulkSavings, symbol)}`}
                      className="text-green-600"
                    />
                  )}
                  {offerBulkSavings > 0 && (
                    <Line
                      label="After offers"
                      value={money(itemsFinalTotal, symbol)}
                      muted
                    />
                  )}
                  {promoDiscount > 0 && (
                    <Line
                      label={`Promo${order.promoCode ? ` (${order.promoCode})` : ""}`}
                      value={`- ${money(promoDiscount, symbol)}`}
                      className="text-green-600"
                    />
                  )}
                  {donationAmount > 0 && (
                    <Line
                      label={
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3 w-3 text-rose-500" />
                          Donation
                        </span>
                      }
                      value={`+ ${money(donationAmount, symbol)}`}
                    />
                  )}
                  {shippingCharges > 0 && (
                    <Line
                      label={
                        <span className="inline-flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          Shipping
                        </span>
                      }
                      value={`+ ${money(shippingCharges, symbol)}`}
                    />
                  )}
                  <div className="mt-2 border-t border-[var(--border-primary)] pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        You paid
                      </span>
                      <span className="text-lg font-bold text-[var(--text-primary)]">
                        {money(grandTotal, symbol)}
                      </span>
                    </div>
                  </div>
                </dl>
              </InfoCard>

              {/* Additional payment requests — always render the card so
                  the customer sees the section exists; empty state inside
                  when admin hasn't added anything. */}
              <InfoCard
                title="Additional payment requests"
                icon={<AlertCircle className="h-4 w-4" />}
              >
                {adjustments.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">
                    No additional charges from the admin.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-primary)] text-left uppercase text-[var(--text-muted)]">
                          <th className="py-1.5 font-medium">Reason</th>
                          <th className="w-20 py-1.5 text-right font-medium">
                            Amount
                          </th>
                          <th className="w-20 py-1.5 text-right font-medium">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-primary)]">
                        {adjustments.map((a: any) => {
                          const showPayCta =
                            a.paymentUrl &&
                            a.impact !== "CREDIT" &&
                            a.status !== "PAID" &&
                            a.status !== "CANCELLED";
                          return (
                            <React.Fragment key={a.id}>
                              <tr className="align-top">
                                <td className="py-2">
                                  <p className="font-medium text-[var(--text-primary)]">
                                    {a.reason ?? a.adjustmentType}
                                  </p>
                                  <p className="text-[10px] text-[var(--text-muted)]">
                                    {a.adjustmentType} · {a.impact} ·{" "}
                                    {formatDateTime(a.createdAt)}
                                  </p>
                                </td>
                                <td className="py-2 text-right font-semibold">
                                  <span
                                    className={cn(
                                      a.impact === "CREDIT"
                                        ? "text-green-600"
                                        : "text-[var(--accent-danger)]",
                                    )}
                                  >
                                    {a.impact === "CREDIT" ? "-" : "+"}
                                    {money(Number(a.amount), symbol)}
                                  </span>
                                </td>
                                <td className="py-2 text-right">
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
                                </td>
                              </tr>
                              {showPayCta && (
                                <tr>
                                  <td colSpan={3} className="pb-3">
                                    <a
                                      href={a.paymentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                                    >
                                      <IndianRupee className="h-3 w-3" />
                                      Pay {money(Number(a.amount), symbol)} now
                                    </a>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                      {adjustmentsTotal !== 0 && (
                        <tfoot>
                          <tr className="border-t border-[var(--border-primary)]">
                            <td className="py-2 text-xs font-semibold text-[var(--text-primary)]">
                              Pending balance
                            </td>
                            <td
                              className="py-2 text-right text-sm font-bold"
                              colSpan={2}
                            >
                              <span
                                className={cn(
                                  adjustmentsTotal < 0
                                    ? "text-green-600"
                                    : "text-[var(--accent-danger)]",
                                )}
                              >
                                {adjustmentsTotal < 0 ? "-" : "+"}
                                {money(
                                  Math.abs(adjustmentsTotal),
                                  symbol,
                                )}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                    {pendingAdjustments.some(
                      (a: any) => a.status === "PENDING",
                    ) && (
                      <p className="mt-2 flex items-start gap-1 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                        <IndianRupee className="mt-0.5 h-3 w-3 shrink-0" />
                        Payment link will be emailed for any pending
                        request.
                      </p>
                    )}
                  </div>
                )}
              </InfoCard>
            </div>

            {/* Customer note */}
            {order.note && (
              <InfoCard
                title="Your note"
                icon={<FileText className="h-4 w-4" />}
              >
                <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
                  {order.note}
                </p>
              </InfoCard>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function InfoCard({
  title,
  icon,
  children,
  noPadding,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)]">
      <header className="flex items-center gap-1.5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {icon}
        {title}
      </header>
      <div className={noPadding ? "" : "p-3 sm:p-4"}>{children}</div>
    </section>
  );
}

function InfoLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <p className="text-sm">
      <span className="text-[var(--text-muted)]">{label}:</span>{" "}
      <span className="font-medium text-[var(--text-primary)]">
        {value ?? "—"}
      </span>
    </p>
  );
}

function AddressBlock(props: {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}) {
  const parts = [
    props.address,
    [props.city, props.state].filter(Boolean).join(", "),
    props.pincode,
    props.country,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="space-y-0.5 text-sm text-[var(--text-secondary)]">
      <p className="font-medium text-[var(--text-primary)]">
        {props.name ?? "—"}
      </p>
      {props.phone && <p className="text-xs">{props.phone}</p>}
      <p className="text-xs">{parts || "—"}</p>
    </div>
  );
}

function OrderItemTableRow({
  idx,
  item,
  symbol,
}: {
  idx: number;
  item: any;
  symbol: string;
}) {
  const qty = Number(item.quantity ?? 0);
  const paidQty = Number(item.paidQty ?? qty);
  const freeQty = Number(item.freeQty ?? 0);
  const originalPrice = Number(item.originalPrice ?? item.pricePerItem ?? 0);
  const effective = Number(item.pricePerItem ?? originalPrice);
  const lineOriginal = originalPrice * qty;
  const lineFinal = effective * paidQty;
  const saved = Number(
    item.savedAmount ?? Math.max(0, lineOriginal - lineFinal),
  );
  const attrs = (item.attributes ?? {}) as Record<string, string>;

  return (
    <tr className="border-b border-[var(--border-primary)] align-top last:border-b-0">
      <td className="px-3 py-3 text-xs text-[var(--text-muted)]">{idx}</td>
      <td className="px-3 py-3">
        <div className="flex gap-2.5">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-secondary)]">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveAssetUrl(item.image)}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-[var(--text-muted)]" />
              </div>
            )}
            {freeQty > 0 && (
              <span className="absolute left-0.5 top-0.5 rounded bg-green-500 px-1 text-[8px] font-bold text-white">
                {freeQty === qty ? "FREE" : `${freeQty} FREE`}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--text-primary)]">
              {item.productName}
            </p>
            {Object.keys(attrs).length > 0 && (
              <p className="text-xs text-[var(--text-muted)]">
                {Object.entries(attrs)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" · ")}
              </p>
            )}
            {(item.offerApplied || item.bulkApplied) && (
              <div className="mt-1 flex flex-wrap gap-1">
                {item.offerApplied && item.offerName && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {item.offerName}
                  </span>
                )}
                {item.bulkApplied && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Bulk price
                  </span>
                )}
                {saved > 0 && (
                  <span className="text-[10px] font-semibold text-green-600">
                    Saved {`${symbol}${saved.toLocaleString("en-IN")}`}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-xs">
        <p className="font-semibold text-[var(--text-primary)]">
          {paidQty} pay
        </p>
        {freeQty > 0 && (
          <p className="text-green-600">+ {freeQty} free</p>
        )}
      </td>
      <td className="px-3 py-3 text-right text-xs">
        {effective < originalPrice ? (
          <>
            <p className="text-[var(--text-muted)] line-through">
              {`${symbol}${originalPrice.toLocaleString("en-IN")}`}
            </p>
            <p className="font-semibold text-[var(--accent-primary)]">
              {`${symbol}${effective.toLocaleString("en-IN")}`}
            </p>
          </>
        ) : (
          <p className="font-medium text-[var(--text-primary)]">
            {`${symbol}${effective.toLocaleString("en-IN")}`}
          </p>
        )}
      </td>
      <td className="px-3 py-3 text-right text-sm">
        {lineFinal < lineOriginal && (
          <p className="text-[10px] text-[var(--text-muted)] line-through">
            {`${symbol}${lineOriginal.toLocaleString("en-IN")}`}
          </p>
        )}
        <p className="font-bold text-[var(--text-primary)]">
          {`${symbol}${lineFinal.toLocaleString("en-IN")}`}
        </p>
      </td>
    </tr>
  );
}

function Line({
  label,
  value,
  className,
  muted,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between text-sm",
        muted && "text-[var(--text-muted)]",
      )}
    >
      <dt className={cn(muted && "text-[var(--text-muted)]")}>{label}</dt>
      <dd className={cn("font-medium", className)}>{value}</dd>
    </div>
  );
}

export default OrderDetailModal;
