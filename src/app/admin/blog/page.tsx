"use client";

import { useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import {
  useAdminBlogs,
  useAdminCreateBlog,
  useAdminUpdateBlog,
  useAdminDeleteBlog,
} from "@/services/admin/blog";
import { useUpload } from "@/services/admin/upload";
import { resolveAssetUrl } from "@/lib/assetUrl";
import type { Blog } from "@/types/blog";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  UploadCloud,
  X,
  FileText,
} from "lucide-react";

type DialogMode = "create" | "edit" | "view" | null;

interface FormState {
  title: string;
  slug: string;
  authorName: string;
  authorImage: string;
  category: string;
  excerpt: string;
  content: string;
  image: string;
  readTime: string;
  isPublished: boolean;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  authorName: "",
  authorImage: "",
  category: "",
  excerpt: "",
  content: "",
  image: "",
  readTime: "",
  isPublished: false,
  isActive: true,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function estimateReadTime(text: string): number {
  const words = text.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<Blog | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugEdited, setSlugEdited] = useState(false);
  const imageRef = useRef<HTMLInputElement | null>(null);
  const authorImageRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading } = useAdminBlogs({ page, limit: 20, search });
  const createMutation = useAdminCreateBlog();
  const updateMutation = useAdminUpdateBlog();
  const deleteMutation = useAdminDeleteBlog();
  const uploadMutation = useUpload();

  const rows = useMemo(() => (data?.data ?? []) as Blog[], [data]);

  const closeDialog = () => {
    setMode(null);
    setSelected(null);
    setForm(EMPTY_FORM);
    setSlugEdited(false);
  };

  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setSlugEdited(false);
    setMode("create");
  };

  const openEdit = (b: Blog) => {
    setSelected(b);
    setForm({
      title: b.title ?? "",
      slug: b.slug ?? "",
      authorName: b.authorName ?? b.author ?? "",
      authorImage: b.authorImage ?? "",
      category: b.category ?? "",
      excerpt: b.excerpt ?? b.shortDescription ?? "",
      content: b.content ?? b.description ?? "",
      image: b.image ?? b.thumbnail ?? "",
      readTime: b.readTime ? String(b.readTime) : "",
      isPublished: b.isPublished ?? false,
      isActive: b.active ?? true,
    });
    setSlugEdited(true);
    setMode("edit");
  };

  const openView = (b: Blog) => {
    setSelected(b);
    setMode("view");
  };

  const handleTitleChange = (v: string) => {
    setForm((f) => ({
      ...f,
      title: v,
      slug: slugEdited ? f.slug : slugify(v),
    }));
  };

  const uploadImage = async (file: File, key: "image" | "authorImage") => {
    const result = await uploadMutation.mutateAsync({ file, folder: "blog" });
    setForm((f) => ({ ...f, [key]: result.url }));
  };

  const handleSubmit = async () => {
    const readTime = form.readTime ? Number(form.readTime) : estimateReadTime(form.content);
    // Backend DTO whitelists exactly these keys; sending anything else
    // (tags, meta*, author, shortDescription, thumbnail) trips a 400.
    const payload: Partial<Blog> = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      authorName: form.authorName.trim() || "Admin",
      authorImage: form.authorImage || undefined,
      category: form.category.trim() || "General",
      excerpt: form.excerpt.trim() || undefined,
      description: form.content,
      image: form.image || undefined,
      readTime,
      isPublished: form.isPublished,
      active: form.isActive,
    };
    if (mode === "edit" && selected) {
      await updateMutation.mutateAsync({ id: selected.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    closeDialog();
  };

  const submitting = createMutation.isPending || updateMutation.isPending || uploadMutation.isPending;

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "image",
      label: "",
      render: (_val, row) => {
        const b = row as unknown as Blog;
        const src = resolveAssetUrl(b.image || b.thumbnail);
        return src ? (
          <img src={src} alt="" className="h-10 w-14 rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)]">
            <FileText className="h-4 w-4" />
          </div>
        );
      },
    },
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (_val, row) => {
        const b = row as unknown as Blog;
        return (
          <div className="min-w-0">
            <p className="truncate font-medium text-[var(--text-primary)]">{b.title}</p>
            <p className="truncate font-mono text-xs text-[var(--text-muted)]">/{b.slug}</p>
          </div>
        );
      },
    },
    {
      key: "authorName",
      label: "Author",
      render: (_val, row) => {
        const b = row as unknown as Blog;
        const name = b.authorName || b.author;
        if (!name) return <span className="text-xs text-[var(--text-muted)]">--</span>;
        const src = resolveAssetUrl(b.authorImage);
        return (
          <div className="flex items-center gap-2">
            {src ? (
              <img src={src} alt={name} className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[10px] font-semibold text-white">
                {name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="text-sm text-[var(--text-primary)]">{name}</span>
          </div>
        );
      },
    },
    {
      key: "category",
      label: "Category",
      render: (val) =>
        val ? (
          <Badge variant="default">{val as string}</Badge>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">--</span>
        ),
    },
    {
      key: "isPublished",
      label: "Status",
      render: (_val, row) => {
        const b = row as unknown as Blog;
        return b.isPublished ? (
          <Badge variant="success">Published</Badge>
        ) : (
          <Badge variant="warning">Draft</Badge>
        );
      },
    },
    {
      key: "readTime",
      label: "Read",
      render: (val) => (val ? `${val} min` : "--"),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (val) => (val ? new Date(val as string).toLocaleDateString() : "--"),
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => {
        const b = row as unknown as Blog;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => openView(b)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(b.id)}>
              <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Blog" description="Publish SEO-friendly blog posts">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Post
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput
          onSearch={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search blog posts..."
          className="max-w-sm"
        />
      </div>

      <Table
        columns={columns}
        data={rows as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage="No blog posts yet"
      />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Create/Edit */}
      <Modal
        isOpen={mode === "create" || mode === "edit"}
        onClose={closeDialog}
        title={mode === "edit" ? "Edit Post" : "Add Post"}
        size="xl"
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Main column */}
          <div className="space-y-4">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="An inspiring title..."
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                Slug <span className="text-[var(--text-muted)]">(SEO-friendly)</span>
              </label>
              <div className="flex items-center overflow-hidden rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                <span className="px-3 py-2 text-sm text-[var(--text-muted)]">/blog/</span>
                <input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setForm({ ...form, slug: slugify(e.target.value) });
                  }}
                  className="flex-1 border-0 bg-transparent px-0 py-2 font-mono text-sm text-[var(--text-primary)] outline-none"
                  placeholder="post-slug"
                />
                {slugEdited && (
                  <button
                    type="button"
                    onClick={() => {
                      setSlugEdited(false);
                      setForm((f) => ({ ...f, slug: slugify(f.title) }));
                    }}
                    className="px-3 py-2 text-xs text-[var(--accent-primary)] hover:underline"
                  >
                    auto
                  </button>
                )}
              </div>
            </div>

            <Textarea
              label="Short description"
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="Summary shown in blog cards and SEO meta fallback..."
              rows={2}
              helperText={`${form.excerpt.length}/160 characters`}
            />

            <Textarea
              label="Long description / Content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="The full blog post. HTML is supported."
              rows={10}
            />
          </div>

          {/* Side column */}
          <div className="space-y-4">
            {/* Cover */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Cover image</label>
              {form.image ? (
                <div className="relative mb-2 aspect-[16/10] overflow-hidden rounded-lg border border-[var(--border-primary)]">
                  <img src={resolveAssetUrl(form.image)} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, image: "" })}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
              <input
                ref={imageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f, "image");
                  e.target.value = "";
                }}
              />
              <Button
                variant="ghost"
                onClick={() => imageRef.current?.click()}
                leftIcon={<UploadCloud className="h-4 w-4" />}
                loading={uploadMutation.isPending}
                className="w-full"
              >
                {form.image ? "Replace image" : "Upload cover"}
              </Button>
              <Input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="Or paste a URL..."
                className="mt-2"
              />
            </div>

            {/* Author */}
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Author
              </p>
              <Input
                label="Name"
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                placeholder="Jane Doe"
              />
              <div className="mt-3">
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                  Author image
                </label>
                <div className="flex items-center gap-2">
                  {form.authorImage ? (
                    <img
                      src={resolveAssetUrl(form.authorImage)}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-muted)]">
                      ?
                    </div>
                  )}
                  <input
                    ref={authorImageRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadImage(f, "authorImage");
                      e.target.value = "";
                    }}
                  />
                  <Button variant="ghost" size="sm" onClick={() => authorImageRef.current?.click()}>
                    Upload
                  </Button>
                  {form.authorImage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setForm({ ...form, authorImage: "" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Input
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Astrology"
            />

            <Input
              label="Read time (minutes)"
              type="number"
              value={form.readTime}
              onChange={(e) => setForm({ ...form, readTime: e.target.value })}
              placeholder={`Auto: ${estimateReadTime(form.content)} min`}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Published</p>
                  <p className="text-xs text-[var(--text-muted)]">Visible to readers</p>
                </div>
                <Switch
                  checked={form.isPublished}
                  onChange={(v) => setForm({ ...form, isPublished: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Active</p>
                  <p className="text-xs text-[var(--text-muted)]">Included in listings</p>
                </div>
                <Switch checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-[var(--border-primary)] pt-4">
          <Button variant="ghost" onClick={closeDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !form.title.trim()}
            loading={submitting}
          >
            {mode === "edit" ? "Update" : "Create"}
          </Button>
        </div>
      </Modal>

      {/* View */}
      <Modal isOpen={mode === "view"} onClose={closeDialog} title="Blog Post" size="lg">
        {selected && (
          <div className="space-y-4">
            {resolveAssetUrl(selected.image || selected.thumbnail) && (
              <img
                src={resolveAssetUrl(selected.image || selected.thumbnail)!}
                alt={selected.title}
                className="aspect-[16/8] w-full rounded-xl object-cover"
              />
            )}
            <div>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{selected.title}</p>
              <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">/blog/{selected.slug}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selected.category && <Badge variant="default">{selected.category}</Badge>}
              {selected.isPublished ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="warning">Draft</Badge>
              )}
              {selected.readTime && (
                <span className="text-xs text-[var(--text-muted)]">{selected.readTime} min read</span>
              )}
            </div>
            {(selected.excerpt || selected.shortDescription) && (
              <p className="text-sm text-[var(--text-secondary)]">
                {selected.excerpt ?? selected.shortDescription}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeDialog}>
                Close
              </Button>
              <Button onClick={() => openEdit(selected)} leftIcon={<Edit className="h-4 w-4" />}>
                Edit
              </Button>
            </div>
          </div>
        )}
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
