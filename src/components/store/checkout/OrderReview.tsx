"use client";

import React from "react";
import Image from "next/image";
import { MapPin, CreditCard, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { usePrice } from "@/hooks/usePrice";

interface OrderItem {
  id: number;
  name: string;
  thumbnail?: string;
  quantity: number;
  price: number;
  variant?: string;
}

interface OrderAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
}

interface OrderTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
}

interface OrderReviewProps {
  items: OrderItem[];
  address: OrderAddress;
  paymentMethod: string;
  totals: OrderTotals;
  onPlaceOrder: () => void;
  loading?: boolean;
  className?: string;
}

export function OrderReview({
  items,
  address,
  paymentMethod,
  totals,
  onPlaceOrder,
  loading,
  className,
}: OrderReviewProps) {
  const { format } = usePrice();

  const paymentLabel =
    paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment";

  return (
    <div className={cn("space-y-5", className)}>
      {/* Items summary */}
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-[var(--text-secondary)]" />
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
            Items ({items.length})
          </h4>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-secondary)]">
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt={item.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                    {item.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {item.name}
                </p>
                {item.variant && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    {item.variant}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {format(item.price * item.quantity)}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Qty: {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery address */}
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
        <div className="mb-2 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[var(--text-secondary)]" />
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
            Delivery Address
          </h4>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="font-medium text-[var(--text-primary)]">
            {address.name}
          </span>
          {address.phone && ` | ${address.phone}`}
          <br />
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ""}
          <br />
          {address.city}, {address.state} - {address.pincode}
        </p>
      </div>

      {/* Payment method */}
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-[var(--text-secondary)]" />
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
            Payment Method
          </h4>
        </div>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {paymentLabel}
        </p>
      </div>

      {/* Totals */}
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Subtotal</span>
            <span className="text-[var(--text-primary)]">{format(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--accent-success)]">Discount</span>
              <span className="text-[var(--accent-success)]">-{format(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Shipping</span>
            <span className="text-[var(--text-primary)]">
              {totals.shipping === 0 ? "Free" : format(totals.shipping)}
            </span>
          </div>
          {totals.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Tax</span>
              <span className="text-[var(--text-primary)]">{format(totals.tax)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-[var(--border-primary)] pt-2 text-base font-bold">
            <span className="text-[var(--text-primary)]">Total</span>
            <span className="text-[var(--text-primary)]">{format(totals.total)}</span>
          </div>
        </div>
      </div>

      {/* Place order */}
      <Button
        fullWidth
        size="lg"
        onClick={onPlaceOrder}
        loading={loading}
        disabled={loading}
      >
        Place Order
      </Button>
    </div>
  );
}

export default OrderReview;
