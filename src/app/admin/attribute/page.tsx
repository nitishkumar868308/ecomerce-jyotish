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
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { Plus, Trash2, Edit } from "lucide-react";

interface Attribute {
  id: number;
  name: string;
  values: string[];
  createdAt: string;
}

export default function AttributePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Attribute | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", values: "" });

  // TODO: wire up attribute service hooks when available
  const isLoading = false;
  const data = { data: [] as Attribute[], page: 1, totalPages: 1 };

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: "", values: "" });
    setModalOpen(true);
  };

  const openEdit = (item: Attribute) => {
    setEditItem(item);
    setForm({ name: item.name, values: item.values.join(", ") });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    // TODO: call create/update mutation
    setModalOpen(false);
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", label: "Name", sortable: true },
    {
      key: "values",
      label: "Values",
      render: (val) => {
        const arr = val as string[];
        return arr?.join(", ") ?? "-";
      },
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
          <Button variant="ghost" size="sm" onClick={() => openEdit(row as unknown as Attribute)}>
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
      <PageHeader title="Attributes" description="Manage product attributes">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Attribute
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search attributes..." className="max-w-sm" />
      </div>

      <Table
        columns={columns}
        data={(data?.data as Record<string, unknown>[]) ?? []}
        loading={isLoading}
        emptyMessage="No attributes found"
      />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit Attribute" : "Add Attribute"}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Color" />
          <Input label="Values (comma separated)" value={form.values} onChange={(e) => setForm({ ...form, values: e.target.value })} placeholder="e.g. Red, Blue, Green" />
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
          // TODO: call delete mutation
          setDeleteId(null);
        }}
        title="Delete Attribute"
        message="Are you sure you want to delete this attribute? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
