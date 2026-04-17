"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { useShippingPricing, useCreateShippingPrice, useDeleteShippingPrice } from "@/services/admin/shipping";
import { Plus, Trash2 } from "lucide-react";

export default function ShippingPricingPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ zone: "", minWeight: "", maxWeight: "", price: "" });

  const { data, isLoading } = useShippingPricing({ page, limit: 20, search });
  const createMutation = useCreateShippingPrice();
  const deleteMutation = useDeleteShippingPrice();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSubmit = async () => {
    await createMutation.mutateAsync({
      zone: form.zone,
      minWeight: Number(form.minWeight),
      maxWeight: Number(form.maxWeight),
      price: Number(form.price),
    });
    setModalOpen(false);
    setForm({ zone: "", minWeight: "", maxWeight: "", price: "" });
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "zone", label: "Zone", sortable: true },
    { key: "minWeight", label: "Min Weight (kg)", sortable: true },
    { key: "maxWeight", label: "Max Weight (kg)", sortable: true },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (val) => `₹${Number(val).toLocaleString()}`,
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id as number)}>
            <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Shipping Pricing" description="Manage shipping rates by zone and weight">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>Add Shipping Rate</Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search shipping rates..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No shipping rates found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Shipping Rate">
        <div className="space-y-4">
          <Input label="Zone" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder="e.g. Domestic, International" />
          <Input label="Min Weight (kg)" type="number" value={form.minWeight} onChange={(e) => setForm({ ...form, minWeight: e.target.value })} placeholder="0" />
          <Input label="Max Weight (kg)" type="number" value={form.maxWeight} onChange={(e) => setForm({ ...form, maxWeight: e.target.value })} placeholder="5" />
          <Input label="Price (₹)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 150" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId !== null) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
          }
        }}
        title="Delete Shipping Rate"
        message="Are you sure you want to delete this shipping rate? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
