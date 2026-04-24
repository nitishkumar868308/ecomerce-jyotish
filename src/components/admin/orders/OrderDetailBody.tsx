"use client";

import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { cn } from "@/lib/utils";
import {
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
  Receipt,
  Heart,
  Tag,
  Truck,
  FileText,
  AlertCircle,
} from "lucide-react";

/**
 * Shared order-detail body used by both:
 *   - User modal (/dashboard/orders view)
 *   - Admin page (/admin/orders/[id])
 *
 * The `variant` prop decides whether SKU / FNSKU columns appear (admin
 * only) and whether the print-only wrapper strips sensitive pricing
 * information when window.print() fires.
 */
interface OrderDetailBodyProps {
  order: Record<string, any>;
  variant?: "user" | "admin";
  /**
   * When true, the print-mode styling kicks in — we hide prices, SKUs,
   * and FNSKUs so the admin's print-out becomes a clean packing slip
   * that can be dropped in the parcel.
   */
  printMode?: boolean;
  /**
   * When true, the customer note + adjustments list are omitted from
   * this block. The admin detail page renders them in the right
   * sidebar below the Quick links card, so the main column stays
   * focused on the order contents.
   */
  hideSidebarSections?: boolean;
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

export function OrderDetailBody({
  order,
  variant = "user",
  printMode = false,
  hideSidebarSections = false,
}: OrderDetailBodyProps) {
  const isAdmin = variant === "admin";
  const symbol = (order.currencySymbol as string) ?? "₹";
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];
  const adjustments = Array.isArray(order.adjustments) ? order.adjustments : [];

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
  const shippingCharges = Number(order.shippingCharges ?? 0);
  const promoDiscount = Number(order.promoDiscount ?? 0);
  const donationAmount = Number(order.donationAmount ?? 0);
  const grandTotal = Number(order.totalAmount ?? 0);

  return (
    <div className="space-y-5">
      {/* Customer + Addresses. `address-grid` class lets the print
          stylesheet force 3 columns regardless of viewport width so the
          packing-slip header band always reads as one horizontal row. */}
      <div className="address-grid grid gap-3 md:grid-cols-3">
        <Section title="Customer" icon={<User className="h-4 w-4" />}>
          <InfoLine label="Name" value={order.userName} />
          <InfoLine label="Email" value={order.userEmail} />
          <InfoLine label="Phone" value={order.userPhone} />
        </Section>

        <Section
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
        </Section>

        <Section
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
        </Section>
      </div>

      {/* Payment — suppressed in print mode (packing slip doesn't need it) */}
      {!printMode && (
        <Section title="Payment" icon={<CreditCard className="h-4 w-4" />}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span>
              <span className="text-[var(--text-muted)]">Method:</span>{" "}
              <span className="font-medium text-[var(--text-primary)]">
                {order.paymentMethod ?? "—"}
              </span>
            </span>
            <Badge
              variant={
                STATUS_VARIANT[String(order.paymentStatus ?? "PENDING")] ??
                "warning"
              }
            >
              {order.paymentStatus ?? "PENDING"}
            </Badge>
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
            {isAdmin && order.orderBy && (
              <span className="text-xs text-[var(--text-muted)]">
                Source: {String(order.orderBy)}
              </span>
            )}
          </div>
        </Section>
      )}

      {/* Order items. Three render modes:
            - Paper: compact packing-slip table (OrderItemsPrintTable)
            - Admin screen: tabular rows (OrderItemsAdminTable)
            - User/other: stacked cards with bigger thumbnails
          Admin pages showed long card-style rows that made scanning a
          10-item order painful — the table keeps everything above the
          fold. */}
      <Section
        title={`Order items (${items.length})`}
        icon={<ShoppingBag className="h-4 w-4" />}
        noPadding={!printMode && isAdmin}
      >
        {printMode ? (
          <OrderItemsPrintTable items={items} />
        ) : isAdmin ? (
          <OrderItemsAdminTable items={items} symbol={symbol} />
        ) : (
          <div className="divide-y divide-[var(--border-primary)]">
            {items.map((it: any) => (
              <OrderItemRow
                key={it.id}
                item={it}
                symbol={symbol}
                isAdmin={isAdmin}
                printMode={printMode}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Pricing breakdown — hidden in print mode so picking staff
          don't see (or misread) amounts. */}
      {!printMode && (
        <Section
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
                  {isAdmin ? "Customer paid" : "You paid"}
                </span>
                <span className="text-lg font-bold text-[var(--text-primary)]">
                  {money(grandTotal, symbol)}
                </span>
              </div>
            </div>
          </dl>
        </Section>
      )}

      {!hideSidebarSections && order.note && (
        <Section
          title={isAdmin ? "Customer note" : "Your note"}
          icon={<FileText className="h-4 w-4" />}
        >
          <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
            {order.note}
          </p>
        </Section>
      )}

      {!hideSidebarSections && !printMode && adjustments.length > 0 && (
        <Section
          title="Additional payment requests"
          icon={<AlertCircle className="h-4 w-4" />}
        >
          <div className="space-y-2">
            {adjustments.map((a: any) => (
              <div
                key={a.id}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {a.reason ?? a.adjustmentType}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {a.adjustmentType} · {a.impact} ·{" "}
                      {formatDateTime(a.createdAt)}
                    </p>
                    {a.paymentTxnId && (
                      <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                        Txn: {a.paymentTxnId}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-bold">
                    {money(Number(a.amount), symbol)}
                  </span>
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
                {/* Payment URL row — admin copy-pastes into a support
                    message or verifies in a new tab. Only surfaced for
                    DEBIT adjustments that are still awaiting payment;
                    a CREDIT/PAID row doesn't need a pay link. */}
                {a.paymentUrl &&
                  a.impact !== "CREDIT" &&
                  a.status !== "PAID" &&
                  a.status !== "CANCELLED" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-amber-200 pt-2 text-xs dark:border-amber-800">
                      <span className="font-semibold text-amber-800 dark:text-amber-200">
                        Payment link
                      </span>
                      <a
                        href={a.paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all font-mono text-[11px] text-indigo-600 underline hover:text-indigo-700 dark:text-indigo-300"
                      >
                        {a.paymentUrl}
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== "undefined" && navigator.clipboard) {
                            navigator.clipboard.writeText(a.paymentUrl);
                          }
                        }}
                        className="rounded-md border border-amber-300 px-2 py-0.5 text-[10px] font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40"
                      >
                        Copy
                      </button>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
  noPadding,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  /** When true, content area has no padding (used for tables that own
   *  their own borders/spacing). Header still gets its normal padding. */
  noPadding?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)]">
      <h3 className="mb-0 flex items-center gap-1.5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] sm:px-4">
        {icon}
        {title}
      </h3>
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

function OrderItemRow({
  item,
  symbol,
  isAdmin,
  printMode,
}: {
  item: any;
  symbol: string;
  isAdmin: boolean;
  printMode: boolean;
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
    <div className="order-item-row flex gap-3 py-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-secondary)] sm:h-16 sm:w-16">
        {item.image ? (
          <Image
            src={resolveAssetUrl(item.image)}
            alt={item.productName ?? ""}
            fill
            className="object-cover"
            sizes="64px"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-[var(--text-muted)]" />
          </div>
        )}
        {freeQty > 0 && (
          <span className="absolute left-1 top-1 rounded bg-green-500 px-1 text-[9px] font-bold text-white">
            {freeQty === qty ? "FREE" : `${freeQty} FREE`}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {item.productName}
        </p>
        {Object.keys(attrs).length > 0 && (
          <p className="text-xs text-[var(--text-muted)]">
            {Object.entries(attrs)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" · ")}
          </p>
        )}

        {/* Admin-only SKU + FNSKU row. Suppressed in print mode so the
            packing slip stays identifier-free. */}
        {isAdmin && !printMode && (item.sku || item.fnsku) && (
          <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">
            {item.sku && <>SKU: {item.sku}</>}
            {item.sku && item.fnsku && <> · </>}
            {item.fnsku && <>FNSKU: {item.fnsku}</>}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-[var(--text-muted)]">
            {paidQty} pay
            {freeQty > 0 && (
              <span className="ml-1 font-medium text-green-600">
                + {freeQty} free
              </span>
            )}
          </span>
          {!printMode && (
            <span className="text-[var(--text-muted)]">
              Unit:{" "}
              <span
                className={cn(
                  "font-medium",
                  effective < originalPrice
                    ? "text-[var(--accent-primary)]"
                    : "text-[var(--text-primary)]",
                )}
              >
                {`${symbol}${effective.toLocaleString("en-IN")}`}
              </span>
              {effective < originalPrice && (
                <span className="ml-1 text-[var(--text-muted)] line-through">
                  {`${symbol}${originalPrice.toLocaleString("en-IN")}`}
                </span>
              )}
            </span>
          )}
        </div>
        {(item.offerApplied || item.bulkApplied) && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.offerApplied && item.offerName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <Tag className="h-2.5 w-2.5" />
                {item.offerName}
              </span>
            )}
            {item.bulkApplied && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Bulk price
              </span>
            )}
            {!printMode && saved > 0 && (
              <span className="text-[10px] font-semibold text-green-600">
                Saved {`${symbol}${saved.toLocaleString("en-IN")}`}
              </span>
            )}
          </div>
        )}
      </div>

      {!printMode && (
        <div className="shrink-0 text-right">
          {lineFinal < lineOriginal && (
            <p className="text-xs text-[var(--text-muted)] line-through">
              {`${symbol}${lineOriginal.toLocaleString("en-IN")}`}
            </p>
          )}
          <p className="text-sm font-bold text-[var(--text-primary)]">
            {`${symbol}${lineFinal.toLocaleString("en-IN")}`}
          </p>
        </div>
      )}
    </div>
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

/**
 * On-screen admin table for order items — denser than the card view so a
 * 10-item order fits without scrolling through giant rows. Keeps SKU +
 * FNSKU columns visible (unlike the user modal), and still surfaces the
 * offer / bulk badge + savings right in the product cell.
 */
function OrderItemsAdminTable({
  items,
  symbol,
}: {
  items: any[];
  symbol: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            <th className="w-8 px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Product</th>
            <th className="w-36 px-3 py-2 font-medium">SKU / FNSKU</th>
            <th className="w-24 px-3 py-2 font-medium">Qty</th>
            <th className="w-24 px-3 py-2 text-right font-medium">Unit</th>
            <th className="w-28 px-3 py-2 text-right font-medium">
              Line total
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((it: any, idx: number) => {
            const qty = Number(it.quantity ?? 0);
            const paidQty = Number(it.paidQty ?? qty);
            const freeQty = Number(it.freeQty ?? 0);
            const originalPrice = Number(
              it.originalPrice ?? it.pricePerItem ?? 0,
            );
            const effective = Number(it.pricePerItem ?? originalPrice);
            const lineOriginal = originalPrice * qty;
            const lineFinal = effective * paidQty;
            const saved = Number(
              it.savedAmount ?? Math.max(0, lineOriginal - lineFinal),
            );
            const attrs = (it.attributes ?? {}) as Record<string, string>;
            return (
              <tr
                key={it.id}
                className="order-item-row border-b border-[var(--border-primary)] align-top last:border-b-0"
              >
                <td className="px-3 py-3 text-xs text-[var(--text-muted)]">
                  {idx + 1}
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-2.5">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[var(--bg-secondary)]">
                      {it.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={resolveAssetUrl(it.image)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingBag className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        </div>
                      )}
                      {freeQty > 0 && (
                        <span className="absolute left-0 top-0 rounded-br bg-green-500 px-0.5 text-[7px] font-bold text-white">
                          {freeQty === qty ? "FREE" : `${freeQty}F`}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                        {it.productName}
                      </p>
                      {Object.keys(attrs).length > 0 && (
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {Object.entries(attrs)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")}
                        </p>
                      )}
                      {(it.offerApplied || it.bulkApplied) && (
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {it.offerApplied && it.offerName && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              {it.offerName}
                            </span>
                          )}
                          {it.bulkApplied && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Bulk
                            </span>
                          )}
                          {saved > 0 && (
                            <span className="text-[9px] font-semibold text-green-600">
                              Saved {`${symbol}${saved.toLocaleString("en-IN")}`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-[10px]">
                  <p className="text-[var(--text-primary)]">{it.sku ?? "—"}</p>
                  {it.fnsku && (
                    <p className="text-[var(--text-muted)]">{it.fnsku}</p>
                  )}
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
                      <p className="text-[10px] text-[var(--text-muted)] line-through">
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
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Compact print-only table for the packing slip. Columns are narrow so
 * a 6-item order still fits on one page alongside the address band.
 * No prices, no SKU / FNSKU — just what a packer needs to pull stock.
 */
function OrderItemsPrintTable({ items }: { items: any[] }) {
  return (
    <table className="order-items-print w-full border-collapse text-[11px]">
      <thead>
        <tr className="border-b border-gray-400">
          <th className="w-8 py-1 text-left font-semibold">#</th>
          <th className="w-12 py-1 text-left font-semibold">Img</th>
          <th className="py-1 text-left font-semibold">Product / variation</th>
          <th className="w-24 py-1 text-left font-semibold">Qty</th>
          <th className="w-28 py-1 text-left font-semibold">Offer / bulk</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it: any, idx: number) => {
          const qty = Number(it.quantity ?? 0);
          const paidQty = Number(it.paidQty ?? qty);
          const freeQty = Number(it.freeQty ?? 0);
          const attrs = (it.attributes ?? {}) as Record<string, string>;
          return (
            <tr
              key={it.id}
              className="order-item-row border-b border-gray-200 align-top"
            >
              <td className="py-2 text-gray-600">{idx + 1}</td>
              <td className="py-2">
                {it.image ? (
                  // Plain <img> rather than next/image so the print
                  // renderer doesn't wait for a lazy-loaded placeholder.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveAssetUrl(it.image)}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-gray-100" />
                )}
              </td>
              <td className="py-2">
                <p className="font-semibold">{it.productName}</p>
                {Object.keys(attrs).length > 0 && (
                  <p className="text-[10px] text-gray-600">
                    {Object.entries(attrs)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ")}
                  </p>
                )}
              </td>
              <td className="py-2">
                <span className="font-semibold">{paidQty} pay</span>
                {freeQty > 0 && (
                  <>
                    {" + "}
                    <span className="font-semibold text-green-700">
                      {freeQty} free
                    </span>
                  </>
                )}
                <div className="text-[10px] text-gray-600">
                  Total: {qty}
                </div>
              </td>
              <td className="py-2">
                {it.offerApplied && it.offerName && (
                  <div className="text-[10px]">
                    <span className="font-semibold">{it.offerName}</span>
                  </div>
                )}
                {it.bulkApplied && (
                  <div className="text-[10px]">Bulk price</div>
                )}
                {!it.offerApplied && !it.bulkApplied && (
                  <div className="text-[10px] text-gray-500">—</div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default OrderDetailBody;
