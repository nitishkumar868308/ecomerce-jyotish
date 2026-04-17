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
import { Badge } from "@/components/ui/Badge";
import { useOffers, useCreateOffer, useUpdateOffer, useDeleteOffer } from "@/services/admin/offers";
import { Plus, Trash2, Edit } from "lucide-react";

export default function OfferPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", discountPercent: "", startDate: "", endDate: "", description: "" });

  const { data, isLoading } = useOffers({ page, limit: 20, search });
  const createMutation = useCreateOffer();
  const updateMutation = useUpdateOffer();
  const deleteMutation = useDeleteOffer();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: "", discountPercent: "", startDate: "", endDate: "", description: "" });
    setModalOpen(true);
  };

  const openEdit = (item: Record<string, unknown>) => {
    setEditItem(item);
    setForm({
      title: item.title as string,
      discountPercent: String(item.discountPercent ?? ""),
      startDate: (item.startDate as string) ?? "",
      endDate: (item.endDate as string) ?? "",
      description: (item.description as string) ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const payload = { ...form, discountPercent: Number(form.discountPercent) };
    if (editItem) {
      await updateMutation.mutateAsync({ id: editItem.id as number, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setModalOpen(false);
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "title", label: "Title", sortable: true },
    {
      key: "discountPercent",
      label: "Discount",
      render: (val) => `${val}%`,
    },
    {
      key: "startDate",
      label: "Start",
      render: (val) => val ? new Date(val as string).toLocaleDateString() : "-",
    },
    {
      key: "endDate",
      label: "End",
      render: (val) => val ? new Date(val as string).toLocaleDateString() : "-",
    },
    {
      key: "isActive",
      label: "Status",
      render: (val) => <Badge variant={val ? "success" : "danger"}>{val ? "Active" : "Inactive"}</Badge>,
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id as number)}>
            <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Offers" description="Manage promotional offers">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>Add Offer</Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search offers..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No offers found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit Offer" : "Add Offer"}>
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Offer title" />
          <Input label="Discount %" type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} placeholder="e.g. 25" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Offer description" />
          <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editItem ? "Update" : "Create"}</Button>
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
        title="Delete Offer"
        message="Are you sure you want to delete this offer? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
