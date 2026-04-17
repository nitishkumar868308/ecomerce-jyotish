"use client";

import { useState, useCallback } from "react";
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
import { useAdminOrders, useAdminUpdateOrder } from "@/services/admin/orders";
import { Plus, Eye, Edit } from "lucide-react";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editOrder, setEditOrder] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState("");

  const { data, isLoading } = useAdminOrders({ page, limit: 20, search });
  const updateMutation = useAdminUpdateOrder();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleUpdateStatus = async () => {
    if (editOrder) {
      await updateMutation.mutateAsync({ id: editOrder.id as number, status });
      setEditOrder(null);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
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
        const s = val as string;
        const variant = s === "DELIVERED" ? "success" : s === "CANCELLED" ? "danger" : s === "SHIPPED" ? "info" : "warning";
        return <Badge variant={variant}>{s}</Badge>;
      },
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (val) => new Date(val as string).toLocaleDateString(),
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setEditOrder(row); setStatus(row.status as string); }}>
            <Edit className="h-4 w-4" />
          </Button>
          <Link href={`/admin/orders/${row.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
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

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search orders..." className="max-w-sm" />
      </div>

      <Table
        columns={columns}
        data={(data?.data as Record<string, unknown>[]) ?? []}
        loading={isLoading}
        emptyMessage="No orders found"
      />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={editOrder !== null} onClose={() => setEditOrder(null)} title="Update Order Status">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Order #{editOrder?.orderNumber as string}</p>
          <Input
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="e.g. SHIPPED, DELIVERED, CANCELLED"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOrder(null)}>Cancel</Button>
            <Button onClick={handleUpdateStatus}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
