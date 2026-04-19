"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/useAuthStore";
import { useOrders } from "@/services/orders";
import { useWalletBalance } from "@/services/wallet";

const quickLinks = [
  { href: "/dashboard/orders", label: "My Orders", icon: "\uD83D\uDCE6" },
  { href: "/dashboard/jyotish", label: "Jyotish", icon: "\u2606" },
  { href: "/dashboard/addresses", label: "Addresses", icon: "\uD83C\uDFE0" },
  { href: "/dashboard/wallet", label: "Wallet", icon: "\uD83D\uDCB0" },
  { href: "/dashboard/profile", label: "Profile", icon: "\uD83D\uDC64" },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: ordersData } = useOrders({ page: 1, limit: 5 });
  const { data: wallet } = useWalletBalance();

  const recentOrders = ordersData?.data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Welcome back, {user?.name || "User"}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Manage your orders, addresses, and account settings
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Total Orders
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--accent-primary)]">
            {ordersData?.data?.meta?.total ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Wallet Balance
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--accent-primary)]">
            &#8377;{(wallet?.balance ?? 0).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Member Since
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--accent-primary)]">
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })
              : "--"}
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {quickLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="text-2xl">{l.icon}</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {l.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Recent Orders
          </h2>
          <Link
            href="/dashboard/orders"
            className="text-sm font-medium text-[var(--accent-primary)] hover:underline"
          >
            View All
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-12 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              No orders yet. Start shopping!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order: any) => (
              <Link
                key={order._id || order.id}
                href={`/dashboard/orders?id=${order._id || order.id}`}
                className="flex items-center justify-between rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-5 py-4 transition-colors hover:bg-[var(--bg-card-hover)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Order #{(order._id || order.id)?.toString().slice(-8)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    &#8377;{order.total?.toLocaleString("en-IN") ?? 0}
                  </p>
                  <span className="inline-block rounded-full bg-[var(--accent-primary-light)] px-2 py-0.5 text-xs font-medium capitalize text-[var(--accent-primary)]">
                    {order.status || "processing"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
