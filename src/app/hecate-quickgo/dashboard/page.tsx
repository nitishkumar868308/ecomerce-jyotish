"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/useAuthStore";
import { useOrders } from "@/services/orders";
import { PrivateRoute } from "@/components/shared/PrivateRoute";

export default function QuickGoDashboardPage() {
  const { user } = useAuthStore();
  const { data: ordersData, isLoading } = useOrders({ page: 1, limit: 5 });
  const orders = ordersData?.data ?? [];

  return (
    <PrivateRoute>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Welcome */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--qg-primary,#0d9488)]/10 text-xl font-bold text-[var(--qg-primary,#0d9488)]">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-xl font-bold">
              Hey, {user?.name || "there"}!
            </h1>
            <p className="text-sm text-[var(--qg-text-secondary,#64748b)]">
              Manage your QuickGo orders and account
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { href: "/hecate-quickgo/categories", label: "Shop Now", icon: "\uD83D\uDED2" },
            { href: "/dashboard/profile", label: "Profile", icon: "\uD83D\uDC64" },
            { href: "/dashboard/wallet", label: "Wallet", icon: "\uD83D\uDCB0" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-center gap-3 rounded-xl border border-[var(--qg-border,#e0f2f1)] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-sm font-medium">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Recent orders */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Link
              href="/dashboard/orders"
              className="text-sm font-medium text-[var(--qg-primary,#0d9488)] hover:underline"
            >
              View All
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl shimmer" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-xl border border-[var(--qg-border,#e0f2f1)] bg-white py-12 text-center">
              <p className="text-sm text-[var(--qg-text-secondary,#64748b)]">
                No orders yet
              </p>
              <Link
                href="/hecate-quickgo/categories"
                className="mt-2 inline-block text-sm font-medium text-[var(--qg-primary,#0d9488)] underline"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => (
                <div
                  key={order._id || order.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--qg-border,#e0f2f1)] bg-white px-5 py-4"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Order #{String(order._id || order.id).slice(-8)}
                    </p>
                    <p className="text-xs text-[var(--qg-text-secondary,#64748b)]">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      &#8377;{order.total?.toLocaleString("en-IN") ?? 0}
                    </p>
                    <span className="inline-block rounded-full bg-[var(--qg-primary,#0d9488)]/10 px-2 py-0.5 text-xs font-medium capitalize text-[var(--qg-primary,#0d9488)]">
                      {order.status || "processing"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PrivateRoute>
  );
}
