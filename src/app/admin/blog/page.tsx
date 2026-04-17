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
import { useAdminBlogs, useAdminCreateBlog, useAdminUpdateBlog, useAdminDeleteBlog } from "@/services/admin/blog";
import { Plus, Trash2, Edit } from "lucide-react";

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", content: "", imageUrl: "" });

  const { data, isLoading } = useAdminBlogs({ page, limit: 20, search });
  const createMutation = useAdminCreateBlog();
  const updateMutation = useAdminUpdateBlog();
  const deleteMutation = useAdminDeleteBlog();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: "", slug: "", excerpt: "", content: "", imageUrl: "" });
    setModalOpen(true);
  };

  const openEdit = (item: Record<string, unknown>) => {
    setEditItem(item);
    setForm({
      title: item.title as string,
      slug: item.slug as string,
      excerpt: (item.excerpt as string) ?? "",
      content: (item.content as string) ?? "",
      imageUrl: (item.imageUrl as string) ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (editItem) {
      await updateMutation.mutateAsync({ id: editItem.id as number, ...form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setModalOpen(false);
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "imageUrl",
      label: "Image",
      render: (val) =>
        val ? (
          <img src={val as string} alt="" className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)]">--</div>
        ),
    },
    { key: "title", label: "Title", sortable: true },
    { key: "slug", label: "Slug" },
    {
      key: "isPublished",
      label: "Status",
      render: (val) => <Badge variant={val ? "success" : "warning"}>{val ? "Published" : "Draft"}</Badge>,
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
      <PageHeader title="Blog" description="Manage blog posts">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>Add Post</Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search blog posts..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No blog posts found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit Post" : "Add Post"}>
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Post title" />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="post-slug" />
          <Input label="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Short description" />
          <Input label="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
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
        title="Delete Blog Post"
        message="Are you sure you want to delete this blog post? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
