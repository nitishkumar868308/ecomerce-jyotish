"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { useAdminStats } from "@/services/admin/dashboard";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import {
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  TrendingUp,
  Clock,
} from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  loading?: boolean;
}) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-primary)]/10">
          <Icon className="h-6 w-6 text-[var(--accent-primary)]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-[var(--text-secondary)]">{title}</p>
          {loading ? (
            <Skeleton variant="text" lines={1} />
          ) : (
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {value}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

const recentOrderColumns: Column<Record<string, unknown>>[] = [
  { key: "orderNumber", label: "Order #", sortable: true },
  {
    key: "user",
    label: "Customer",
    render: (val) => {
      const user = val as { name: string } | undefined;
      return user?.name ?? "-";
    },
  },
  {
    key: "total",
    label: "Total",
    sortable: true,
    render: (val) => `₹${Number(val).toLocaleString()}`,
  },
  {
    key: "status",
    label: "Status",
    render: (val) => {
      const status = val as string;
      const variant =
        status === "DELIVERED"
          ? "success"
          : status === "CANCELLED"
            ? "danger"
            : status === "SHIPPED"
              ? "info"
              : "warning";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    key: "createdAt",
    label: "Date",
    render: (val) => new Date(val as string).toLocaleDateString(),
  },
];

export default function DashboardPage() {
  const { data: stats, isLoading } = useAdminStats();

  const formatCurrency = (val: number) =>
    `₹${val.toLocaleString("en-IN")}`;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your store performance"
      />

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders ?? 0}
          icon={ShoppingCart}
          loading={isLoading}
        />
        <StatCard
          title="Revenue"
          value={stats ? formatCurrency(stats.totalRevenue) : "₹0"}
          icon={DollarSign}
          loading={isLoading}
        />
        <StatCard
          title="Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          loading={isLoading}
        />
        <StatCard
          title="Products"
          value={stats?.totalProducts ?? 0}
          icon={Package}
          loading={isLoading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="Pending Orders"
          value={stats?.pendingOrders ?? 0}
          icon={Clock}
          loading={isLoading}
        />
        <StatCard
          title="Recent Orders (7 days)"
          value={stats?.recentOrders ?? 0}
          icon={TrendingUp}
          loading={isLoading}
        />
      </div>

      {/* Charts Placeholder */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            Monthly Sales
          </h3>
          {isLoading ? (
            <Skeleton variant="rectangular" className="h-64 w-full" />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-[var(--border-primary)] text-[var(--text-secondary)]">
              {stats?.monthlySales && stats.monthlySales.length > 0 ? (
                <div className="flex h-full w-full items-end gap-2 p-4">
                  {stats.monthlySales.map((m, i) => {
                    const maxRev = Math.max(
                      ...stats.monthlySales.map((s) => s.revenue),
                    );
                    const heightPct = maxRev > 0 ? (m.revenue / maxRev) * 100 : 0;
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t bg-[var(--accent-primary)] transition-all"
                          style={{ height: `${Math.max(heightPct, 4)}%` }}
                          title={`₹${m.revenue.toLocaleString()}`}
                        />
                        <span className="text-xs text-[var(--text-secondary)]">
                          {m.month.slice(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>Chart placeholder -- integrate a charting library</p>
              )}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            Top Products
          </h3>
          {isLoading ? (
            <Skeleton variant="rectangular" className="h-64 w-full" />
          ) : (
            <div className="space-y-3">
              {stats?.topProducts && stats.topProducts.length > 0 ? (
                stats.topProducts.map((product, i) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-sm font-bold text-[var(--accent-primary)]">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {product.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {formatCurrency(product.revenue)}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {product.sold} sold
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-[var(--text-secondary)]">
                  No top products data yet
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
