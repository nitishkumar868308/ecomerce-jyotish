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
import { useSubcategories, useCreateSubcategory, useUpdateSubcategory, useDeleteSubcategory } from "@/services/categories";
import { Plus, Trash2, Edit } from "lucide-react";

export default function SubcategoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", categoryId: "" });

  const { data, isLoading } = useSubcategories({ page, limit: 20, search });
  const createMutation = useCreateSubcategory();
  const updateMutation = useUpdateSubcategory();
  const deleteMutation = useDeleteSubcategory();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: "", slug: "", categoryId: "" });
    setModalOpen(true);
  };

  const openEdit = (item: Record<string, unknown>) => {
    setEditItem(item);
    setForm({ name: item.name as string, slug: item.slug as string, categoryId: String(item.categoryId ?? "") });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const payload = { ...form, categoryId: Number(form.categoryId) };
    if (editItem) {
      await updateMutation.mutateAsync({ id: editItem.id as number, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setModalOpen(false);
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "slug", label: "Slug" },
    {
      key: "category",
      label: "Parent Category",
      render: (val) => {
        const cat = val as { name: string } | undefined;
        return cat?.name ?? "-";
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
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id as number)}>
            <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Subcategories" description="Manage product subcategories">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>Add Subcategory</Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search subcategories..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No subcategories found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit Subcategory" : "Add Subcategory"}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Subcategory name" />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="subcategory-slug" />
          <Input label="Category ID" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} placeholder="Parent category ID" />
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
        title="Delete Subcategory"
        message="Are you sure you want to delete this subcategory? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
