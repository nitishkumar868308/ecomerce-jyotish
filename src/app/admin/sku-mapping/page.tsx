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

export default function SkuMappingPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ internalSku: "", externalSku: "", platform: "", productId: "" });

  // TODO: wire up SKU mapping service hooks when available
  const isLoading = false;
  const data = { data: [] as Record<string, unknown>[], page: 1, totalPages: 1 };

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ internalSku: "", externalSku: "", platform: "", productId: "" });
    setModalOpen(true);
  };

  const openEdit = (item: Record<string, unknown>) => {
    setEditItem(item);
    setForm({
      internalSku: (item.internalSku as string) ?? "",
      externalSku: (item.externalSku as string) ?? "",
      platform: (item.platform as string) ?? "",
      productId: String(item.productId ?? ""),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    // TODO: call create/update mutation
    setModalOpen(false);
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "internalSku", label: "Internal SKU", sortable: true },
    { key: "externalSku", label: "External SKU", sortable: true },
    { key: "platform", label: "Platform", sortable: true },
    {
      key: "product",
      label: "Product",
      render: (val) => {
        const product = val as { name: string } | undefined;
        return product?.name ?? "-";
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
      <PageHeader title="SKU Mapping" description="Map internal SKUs to external platform SKUs">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>Add Mapping</Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search SKU mappings..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No SKU mappings found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit SKU Mapping" : "Add SKU Mapping"}>
        <div className="space-y-4">
          <Input label="Internal SKU" value={form.internalSku} onChange={(e) => setForm({ ...form, internalSku: e.target.value })} placeholder="e.g. SKU-001" />
          <Input label="External SKU" value={form.externalSku} onChange={(e) => setForm({ ...form, externalSku: e.target.value })} placeholder="e.g. AMZN-001" />
          <Input label="Platform" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} placeholder="e.g. Amazon, Flipkart" />
          <Input label="Product ID" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} placeholder="Internal product ID" />
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
        title="Delete SKU Mapping"
        message="Are you sure you want to delete this SKU mapping? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
