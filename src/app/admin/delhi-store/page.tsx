"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { useDelhiStore, useUpdateDelhiStore } from "@/services/admin/warehouse";
import { Edit } from "lucide-react";

export default function DelhiStorePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ stock: "", minStock: "" });

  const { data, isLoading } = useDelhiStore({ page, limit: 20, search });
  const updateMutation = useUpdateDelhiStore();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const openEdit = (item: Record<string, unknown>) => {
    setEditItem(item);
    setForm({ stock: String(item.stock ?? ""), minStock: String(item.minStock ?? "") });
  };

  const handleUpdate = async () => {
    if (editItem) {
      await updateMutation.mutateAsync({
        id: editItem.id as number,
        stock: Number(form.stock),
        minStock: Number(form.minStock),
      });
      setEditItem(null);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "__serial",
      label: "#",
      render: (_v, _r, i) => (
        <span className="font-medium text-[var(--text-secondary)]">
          {(i ?? 0) + 1}
        </span>
      ),
    },
    {
      key: "productName",
      label: "Product",
      render: (val, row) => {
        // `productName` is the new enriched field from the service; we
        // keep the `row.product.name` fallback so older data in the
        // cache still renders during the first post-deploy refetch.
        const name =
          (val as string) ??
          ((row.product as { name?: string } | null)?.name as string) ??
          "—";
        const variation = row.variationName as string | undefined;
        return (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
              {name}
            </p>
            {variation && (
              <p className="truncate text-xs text-[var(--text-muted)]">
                {variation}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "sku",
      label: "SKU",
      render: (val) => (
        <span className="font-mono text-xs">{(val as string) ?? "—"}</span>
      ),
    },
    {
      key: "warehouseName",
      label: "Warehouse",
      render: (val, row) => {
        const name = (val as string) ?? "—";
        const city = row.warehouseCity as string | undefined;
        const state = row.warehouseState as string | undefined;
        return (
          <div className="min-w-0">
            <p className="truncate text-sm text-[var(--text-primary)]">
              {name}
            </p>
            {(city || state) && (
              <p className="truncate text-xs text-[var(--text-muted)]">
                {[city, state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        );
      },
    },
    { key: "stock", label: "Stock", sortable: true },
    {
      key: "status",
      label: "Status",
      render: (val) => {
        const s = (val as string) ?? "accepted";
        const variant =
          s === "accepted" || s === "in_stock"
            ? "success"
            : s === "low" || s === "pending"
              ? "warning"
              : "default";
        return <Badge variant={variant}>{s}</Badge>;
      },
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Delhi Store" description="Manage Delhi store inventory" />

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search inventory..." className="max-w-sm" />
      </div>

      <Table
        columns={columns}
        data={(Array.isArray(data) ? data : []) as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage="No inventory found"
      />

      {/* Backend currently returns a flat list — no pagination wrapper yet.
          Left the placeholder here so when delhi-store gets paginated we
          only have to add back the meta. */}

      <Modal isOpen={editItem !== null} onClose={() => setEditItem(null)} title="Update Stock">
        <div className="space-y-4">
          <Input label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Current stock" />
          <Input label="Min Stock" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} placeholder="Minimum stock threshold" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
