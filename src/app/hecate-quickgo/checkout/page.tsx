"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/stores/useCartStore";
import { useCreateOrder } from "@/services/orders";

export default function QuickGoCheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const createOrder = useCreateOrder();
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrder.mutate(
      {
        items: items.map((item: any) => ({
          productId: item._id || item.id,
          quantity: item.quantity || 1,
          price: item.price,
        })),
        shippingAddress: address,
        total: total(),
      } as any,
      {
        onSuccess: () => {
          clearCart();
          router.push("/payment-success");
        },
      },
    );
  };

  const inputCls =
    "w-full rounded-lg border border-[var(--qg-border,#e0f2f1)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--qg-primary,#0d9488)] focus:ring-2 focus:ring-[var(--qg-primary,#0d9488)]/20";
  const labelCls = "mb-1.5 block text-sm font-medium";

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg font-semibold">Your cart is empty</p>
        <Link
          href="/hecate-quickgo/categories"
          className="text-sm text-[var(--qg-primary,#0d9488)] underline"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-2">
          <div className="rounded-xl border border-[var(--qg-border,#e0f2f1)] bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Delivery Address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Full Name</label>
                <input type="text" required value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" required value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelCls}>Address</label>
              <input type="text" required value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} className={inputCls} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelCls}>City</label>
                <input type="text" required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input type="text" required value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Pincode</label>
                <input type="text" required value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} className={inputCls} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={createOrder.isPending}
            className="w-full rounded-xl bg-[var(--qg-primary,#0d9488)] py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] disabled:opacity-50"
          >
            {createOrder.isPending ? "Placing Order..." : "Place Order"}
          </button>
        </form>

        {/* Order summary */}
        <div className="rounded-xl border border-[var(--qg-border,#e0f2f1)] bg-white p-6 lg:sticky lg:top-20 lg:self-start">
          <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
          <div className="divide-y divide-[var(--qg-border,#e0f2f1)]">
            {items.map((item: any) => (
              <div
                key={item._id || item.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-xs text-[var(--qg-text-secondary,#64748b)]">
                    Qty: {item.quantity || 1}
                  </p>
                </div>
                <p className="shrink-0 font-semibold">
                  &#8377;{((item.price ?? 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-[var(--qg-border,#e0f2f1)] pt-4 text-base font-bold">
            <span>Total</span>
            <span className="text-[var(--qg-primary,#0d9488)]">
              &#8377;{total().toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
