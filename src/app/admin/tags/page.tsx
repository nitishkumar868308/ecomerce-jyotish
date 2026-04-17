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
import { useTags, useCreateTag, useDeleteTag } from "@/services/admin/tags";
import { Plus, Trash2 } from "lucide-react";

export default function TagsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", slug: "" });

  const { data, isLoading } = useTags({ page, limit: 20, search });
  const createMutation = useCreateTag();
  const deleteMutation = useDeleteTag();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSubmit = async () => {
    await createMutation.mutateAsync(form);
    setModalOpen(false);
    setForm({ name: "", slug: "" });
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "slug", label: "Slug" },
    {
      key: "productCount",
      label: "Products",
      sortable: true,
      render: (val) => val ?? 0,
    },
    {
      key: "createdAt",
      label: "Created",
      render: (val) => new Date(val as string).toLocaleDateString(),
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
      <PageHeader title="Tags" description="Manage product tags">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>Add Tag</Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search tags..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No tags found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Tag">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tag name" />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="tag-slug" />
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
        title="Delete Tag"
        message="Are you sure you want to delete this tag? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
