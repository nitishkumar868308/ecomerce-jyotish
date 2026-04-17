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
import { useMarketLinks, useCreateMarketLink, useDeleteMarketLink } from "@/services/admin/external-market";
import { Plus, Trash2, ExternalLink } from "lucide-react";

export default function ExternalMarketPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ platform: "", productId: "", externalUrl: "" });

  const { data, isLoading } = useMarketLinks({ page, limit: 20, search });
  const createMutation = useCreateMarketLink();
  const deleteMutation = useDeleteMarketLink();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSubmit = async () => {
    await createMutation.mutateAsync(form);
    setModalOpen(false);
    setForm({ platform: "", productId: "", externalUrl: "" });
  };

  const columns: Column<Record<string, unknown>>[] = [
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
      key: "externalUrl",
      label: "URL",
      render: (val) => (
        <a href={val as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[var(--accent-primary)] hover:underline">
          <ExternalLink className="h-3 w-3" /> Link
        </a>
      ),
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
      <PageHeader title="External Marketplace" description="Manage external marketplace links">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>Add Link</Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search marketplace links..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No marketplace links found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Marketplace Link">
        <div className="space-y-4">
          <Input label="Platform" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} placeholder="e.g. Amazon, Flipkart" />
          <Input label="Product ID" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} placeholder="Internal product ID" />
          <Input label="External URL" value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} placeholder="https://..." />
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
        title="Delete Marketplace Link"
        message="Are you sure you want to delete this marketplace link? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
