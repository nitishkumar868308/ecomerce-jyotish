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
import { useSendToWarehouse, useCreateSendToWarehouse } from "@/services/admin/warehouse";
import { Plus } from "lucide-react";

export default function SendToWarehousePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", warehouseId: "", quantity: "" });

  const { data, isLoading } = useSendToWarehouse({ page, limit: 20, search });
  const createMutation = useCreateSendToWarehouse();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSubmit = async () => {
    await createMutation.mutateAsync({
      productId: Number(form.productId),
      warehouseId: Number(form.warehouseId),
      quantity: Number(form.quantity),
    });
    setModalOpen(false);
    setForm({ productId: "", warehouseId: "", quantity: "" });
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
    {
      key: "warehouse",
      label: "Warehouse",
      render: (val) => {
        const wh = val as { name: string } | undefined;
        return wh?.name ?? "-";
      },
    },
    { key: "quantity", label: "Quantity", sortable: true },
    {
      key: "status",
      label: "Status",
      render: (val) => {
        const s = val as string;
        return <Badge variant={s === "DELIVERED" ? "success" : s === "IN_TRANSIT" ? "info" : "warning"}>{s}</Badge>;
      },
    },
    {
      key: "createdAt",
      label: "Date",
      render: (val) => new Date(val as string).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <PageHeader title="Send to Warehouse" description="Manage warehouse stock transfers">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>New Transfer</Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search transfers..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No transfers found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Stock Transfer">
        <div className="space-y-4">
          <Input label="Product ID" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} placeholder="Product ID" />
          <Input label="Warehouse ID" value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} placeholder="Destination warehouse ID" />
          <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="Quantity to transfer" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Send</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
