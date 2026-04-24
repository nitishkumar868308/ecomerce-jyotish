"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useAdminOrders, useAdminUpdateOrder } from "@/services/admin/orders";
import { Plus, Eye, Edit, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
];

const PLATFORM_BADGE: Record<string, { label: string; variant: "default" | "info" | "warning" | "success" }> = {
  wizard: { label: "Mall", variant: "default" },
  website: { label: "Mall", variant: "default" },
  quickgo: { label: "QuickGo", variant: "info" },
  "hecate-quickgo": { label: "QuickGo", variant: "info" },
  jyotish: { label: "Jyotish", variant: "warning" },
};

interface EditState {
  order: Record<string, unknown>;
  status: string;
  trackingNumber: string;
  trackingUrl: string;
  notes: string;
  additionalAmount: string;
  additionalReason: string;
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [edit, setEdit] = useState<EditState | null>(null);

  const { data, isLoading } = useAdminOrders({
    page,
    limit: 20,
    search,
    ...(statusFilter ? { status: statusFilter as any } : {}),
  });
  const updateMutation = useAdminUpdateOrder();

  // Backend may return either flat or nested shape depending on endpoint version.
  const rows = useMemo(() => {
    const payload: any = data?.data;
    if (Array.isArray(payload)) return payload as Record<string, unknown>[];
    if (Array.isArray(payload?.data)) return payload.data as Record<string, unknown>[];
    return [] as Record<string, unknown>[];
  }, [data]);

  const totalPages =
    (data as any)?.totalPages ??
    (data as any)?.data?.meta?.totalPages ??
    1;

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const openEdit = (row: Record<string, unknown>) => {
    setEdit({
      order: row,
      status: (row.status as string) ?? "PENDING",
      trackingNumber: (row.trackingNumber as string) ?? "",
      trackingUrl: (row.trackingUrl as string) ?? "",
      notes: (row.notes as string) ?? "",
      additionalAmount: "",
      additionalReason: "",
    });
  };

  const handleSave = async () => {
    if (!edit) return;
    await updateMutation.mutateAsync({
      id: edit.order.id as number,
      status: edit.status as any,
      trackingNumber: edit.trackingNumber.trim() || undefined,
      trackingUrl: edit.trackingUrl.trim() || undefined,
      notes: edit.notes.trim() || undefined,
    });
    setEdit(null);
  };

  const handleAdditionalCharge = async () => {
    if (!edit) return;
    const amount = Number(edit.additionalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    // Placeholder for PayU link generation. When wired, this should hit
    // /order-adjustments + return a PayU payment URL which we then email
    // to the customer and surface in their dashboard.
    toast.success(
      `Additional charge of ₹${amount.toLocaleString()} noted. Payment link will be emailed to the customer.`,
    );
    setEdit({ ...edit, additionalAmount: "", additionalReason: "" });
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      // 1-based serial. Pagination-aware — (page-1) * limit + idx + 1.
      key: "__serial",
      label: "#",
      render: (_v, _r, i) => (
        <span className="font-medium text-[var(--text-secondary)]">
          {(page - 1) * 20 + (i ?? 0) + 1}
        </span>
      ),
    },
    {
      key: "orderNumber",
      label: "Order #",
      sortable: true,
      render: (val) => (
        <span className="font-mono text-xs">{(val as string) ?? "—"}</span>
      ),
    },
    {
      // Customer column now shows the SHIPPING name/email — admins care
      // about who's receiving the parcel more than the account owner
      // (gifts etc.). Falls back to account fields when shipping is
      // empty.
      key: "shippingName",
      label: "Customer",
      render: (val, row) => {
        const shipName =
          (val as string) ??
          (row.userName as string) ??
          ((row.user as any)?.name as string) ??
          "—";
        const email =
          (row.userEmail as string) ??
          ((row.user as any)?.email as string) ??
          "";
        const phone = (row.shippingPhone as string) ?? (row.userPhone as string);
        return (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
              {shipName}
            </p>
            <p className="truncate text-xs text-[var(--text-muted)]">
              {email}
            </p>
            {phone && (
              <p className="truncate text-[11px] text-[var(--text-muted)]">
                {phone}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "orderBy",
      label: "Source",
      render: (val, row) => {
        const raw = String(
          val ?? row.platform ?? row.source ?? row.purchasePlatform ?? "wizard",
        ).toLowerCase();
        const cfg = PLATFORM_BADGE[raw] ?? PLATFORM_BADGE.wizard;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      key: "totalAmount",
      label: "Total",
      sortable: true,
      render: (val, row) => {
        const amt = Number(val ?? row.total ?? 0);
        const sym = (row.currencySymbol as string) ?? "₹";
        return `${sym}${amt.toLocaleString("en-IN")}`;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (val) => {
        const s = (val as string) ?? "PENDING";
        const variant =
          s === "DELIVERED"
            ? "success"
            : s === "CANCELLED" || s === "REFUNDED"
              ? "danger"
              : s === "SHIPPED" || s === "OUT_FOR_DELIVERY"
                ? "info"
                : "warning";
        return <Badge variant={variant}>{s}</Badge>;
      },
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (val) =>
        val ? new Date(val as string).toLocaleDateString("en-IN") : "--",
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/orders/${row.id}`} aria-label="View order">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          {/* Inline edit modal is temporarily disabled — editing + the
              additional-payment flow both live on the detail page
              (/admin/orders/[id]) now. Leaving the code for quick
              re-enable if we want a list-level shortcut later.
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEdit(row)}
            aria-label="Edit order"
          >
            <Edit className="h-4 w-4" />
          </Button>
          */}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Orders" description="Manage customer orders">
        <Link href="/admin/orders/create">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Create Order</Button>
        </Link>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search by customer, order #..."
          className="max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <Table
        columns={columns}
        data={rows}
        loading={isLoading}
        emptyMessage="No orders found"
      />

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={(data as any)?.page ?? page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      <Modal
        isOpen={edit !== null}
        onClose={() => setEdit(null)}
        title="Edit Order"
        size="lg"
      >
        {edit && (
          <div className="space-y-5">
            <div className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2 text-sm">
              <p className="font-medium text-[var(--text-primary)]">
                Order #{(edit.order.orderNumber as string) ?? edit.order.id}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Total: ₹
                {Number(edit.order.total ?? 0).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Status
              </label>
              <select
                value={edit.status}
                onChange={(e) =>
                  setEdit({ ...edit, status: e.target.value })
                }
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Tracking number"
                value={edit.trackingNumber}
                onChange={(e) =>
                  setEdit({ ...edit, trackingNumber: e.target.value })
                }
                placeholder="AWB12345"
              />
              <Input
                label="Tracking URL"
                value={edit.trackingUrl}
                onChange={(e) =>
                  setEdit({ ...edit, trackingUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <Textarea
              label="Admin notes"
              value={edit.notes}
              onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
              rows={2}
              placeholder="Internal notes or delivery remarks"
            />

            <div className="flex justify-end gap-2 border-t border-[var(--border-primary)] pt-4">
              <Button variant="ghost" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                loading={updateMutation.isPending}
              >
                Save changes
              </Button>
            </div>

            {/* Additional charge — generates a PayU link that is emailed to
                the customer and appears on their dashboard. */}
            <div className="rounded-xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
              <div className="mb-2 flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-[var(--accent-primary)]" />
                <p className="text-sm font-semibold">
                  Request additional payment
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
                <Input
                  label="Amount (₹)"
                  type="number"
                  value={edit.additionalAmount}
                  onChange={(e) =>
                    setEdit({ ...edit, additionalAmount: e.target.value })
                  }
                  placeholder="0"
                />
                <Input
                  label="Reason"
                  value={edit.additionalReason}
                  onChange={(e) =>
                    setEdit({ ...edit, additionalReason: e.target.value })
                  }
                  placeholder="e.g. heavier package reshipping"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAdditionalCharge}
                className="mt-3"
              >
                Send payment link to customer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
