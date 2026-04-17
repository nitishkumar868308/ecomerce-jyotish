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
      key: "product",
      label: "Product",
      render: (val) => {
        const product = val as { name: string } | undefined;
        return product?.name ?? "-";
      },
    },
    { key: "sku", label: "SKU" },
    { key: "stock", label: "Stock", sortable: true },
    { key: "minStock", label: "Min Stock" },
    {
      key: "stock",
      label: "Status",
      render: (val, row) => {
        const stock = val as number;
        const min = row.minStock as number;
        return <Badge variant={stock <= min ? "danger" : "success"}>{stock <= min ? "Low Stock" : "In Stock"}</Badge>;
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

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No inventory found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

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
