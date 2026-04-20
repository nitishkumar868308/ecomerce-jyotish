"use client";

import React from "react";
import Link from "next/link";
import {
  Package,
  Wallet as WalletIcon,
  Sparkles,
  User as UserIcon,
  MapPin,
  Store,
  Zap,
  ShoppingBag,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useOrders } from "@/services/orders";
import { useWalletBalance } from "@/services/wallet";

const SECTIONS = [
  { href: "/dashboard/orders", label: "My Orders", Icon: Package },
  { href: "/dashboard/wallet", label: "Wallet", Icon: WalletIcon },
  { href: "/dashboard/jyotish", label: "Jyotish", Icon: Sparkles },
  { href: "/dashboard/addresses", label: "Addresses", Icon: MapPin },
  { href: "/dashboard/profile", label: "Profile", Icon: UserIcon },
];

const PLATFORM_STYLES: Record<
  string,
  { label: string; tone: string; href: string }
> = {
  wizard: {
    label: "Hecate Mall",
    tone: "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]",
    href: "/",
  },
  quickgo: {
    label: "QuickGo",
    tone: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    href: "/hecate-quickgo/home",
  },
  jyotish: {
    label: "Jyotish",
    tone: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    href: "/jyotish",
  },
};

function platformOf(order: any): keyof typeof PLATFORM_STYLES {
  const raw = String(order.platform ?? "").toLowerCase();
  if (raw === "quickgo" || raw === "hecate-quickgo") return "quickgo";
  if (raw === "jyotish") return "jyotish";
  return "wizard";
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: ordersData } = useOrders({ page: 1, limit: 5 });
  const { data: wallet } = useWalletBalance();

  const recentOrders = ordersData?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Welcome back, {user?.name || "User"}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          One place for your Mall, QuickGo and Jyotish activity.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Total Orders
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--accent-primary)]">
            {ordersData?.total ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Wallet Balance
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--accent-primary)]">
                &#8377;{(wallet?.balance ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
            <Link
              href="/dashboard/wallet/add-money"
              className="rounded-lg bg-[var(--accent-primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20"
            >
              + Add
            </Link>
          </div>
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

      {/* Platform shortcuts — click-through to each storefront */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Link
          href="/"
          className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-[var(--border-primary)] bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent p-4 hover:border-[var(--accent-primary)]/40"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
              Shop
            </p>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              Hecate Wizard Mall
            </p>
          </div>
          <Store className="h-6 w-6 text-[var(--accent-primary)] opacity-70 transition-opacity group-hover:opacity-100" />
        </Link>
        <Link
          href="/hecate-quickgo/home"
          className="group flex items-center justify-between overflow-hidden rounded-xl border border-[var(--border-primary)] bg-gradient-to-br from-teal-500/10 to-transparent p-4 hover:border-teal-400/40"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Fast delivery
            </p>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              Hecate QuickGo
            </p>
          </div>
          <Zap className="h-6 w-6 text-teal-600 dark:text-teal-400" />
        </Link>
        <Link
          href="/jyotish"
          className="group flex items-center justify-between overflow-hidden rounded-xl border border-[var(--border-primary)] bg-gradient-to-br from-purple-500/10 to-transparent p-4 hover:border-purple-400/40"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Astrology
            </p>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              Jyotish Consultations
            </p>
          </div>
          <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </Link>
      </div>

      {/* Quick Links */}
      <div className="mb-8 grid gap-3 grid-cols-2 sm:grid-cols-5">
        {SECTIONS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 text-center transition-all hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/40 hover:shadow-md"
          >
            <Icon className="h-5 w-5 text-[var(--accent-primary)]" />
            <span className="text-xs font-medium text-[var(--text-primary)] sm:text-sm">
              {label}
            </span>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Recent Activity
          </h2>
          <Link
            href="/dashboard/orders"
            className="text-sm font-medium text-[var(--accent-primary)] hover:underline"
          >
            View all orders
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-12 text-center">
            <ShoppingBag className="h-10 w-10 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">
              No orders yet. Start exploring to see your activity here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order: any) => {
              const platform = platformOf(order);
              const tone = PLATFORM_STYLES[platform];
              return (
                <Link
                  key={order._id || order.id}
                  href={`/dashboard/orders?id=${order._id || order.id}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-5 py-4 transition-colors hover:bg-[var(--bg-card-hover)]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        Order #{(order._id || order.id)?.toString().slice(-8)}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone.tone}`}
                      >
                        {tone.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : ""}
                      {order.items && ` \u2022 ${order.items.length} item(s)`}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
