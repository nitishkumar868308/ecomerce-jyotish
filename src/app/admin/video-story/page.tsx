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
import { useAdminVideoStories, useAdminCreateVideoStory, useAdminDeleteVideoStory } from "@/services/admin/banners";
import { Plus, Trash2 } from "lucide-react";

export default function VideoStoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", videoUrl: "", thumbnailUrl: "" });

  const { data, isLoading } = useAdminVideoStories({ page, limit: 20, search });
  const createMutation = useAdminCreateVideoStory();
  const deleteMutation = useAdminDeleteVideoStory();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSubmit = async () => {
    await createMutation.mutateAsync(form);
    setModalOpen(false);
    setForm({ title: "", videoUrl: "", thumbnailUrl: "" });
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "thumbnailUrl",
      label: "Thumbnail",
      render: (val) =>
        val ? (
          <img src={val as string} alt="" className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)]">--</div>
        ),
    },
    { key: "title", label: "Title", sortable: true },
    { key: "videoUrl", label: "Video URL" },
    {
      key: "isActive",
      label: "Status",
      render: (val) => <Badge variant={val ? "success" : "danger"}>{val ? "Active" : "Inactive"}</Badge>,
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
      <PageHeader title="Video Stories" description="Manage video stories for the storefront">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>Add Video Story</Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search video stories..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No video stories found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Video Story">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Story title" />
          <Input label="Video URL" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://..." />
          <Input label="Thumbnail URL" value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder="https://..." />
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
        title="Delete Video Story"
        message="Are you sure you want to delete this video story? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
