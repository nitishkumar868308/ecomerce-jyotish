"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import {
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
} from "@/services/admin/tags";
import type { Tag } from "@/types/product";
import { Plus, Edit, Eye, Trash2, AlertCircle, TagIcon } from "lucide-react";

type DialogMode = "create" | "edit" | "view" | null;

type TagForm = {
  name: string;
  /** Leave empty to let the backend auto-generate from `name`. */
  slug: string;
  active: boolean;
};

const emptyForm: TagForm = { name: "", slug: "", active: true };

// Local slug preview — matches the server's logic (kebab-case, alphanumeric
// only). Shown under the Slug input so admins know what the record will look
// like before submitting.
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function TagsPage() {
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [viewing, setViewing] = useState<Tag | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<TagForm>(emptyForm);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { data, isLoading, error } = useTags();
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();

  const rows = useMemo(() => {
    const list = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.slug ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setDialogMode("create");
  };

  const openEdit = (item: Tag) => {
    setEditing(item);
    setForm({
      name: item.name,
      slug: item.slug ?? "",
      active: item.active ?? true,
    });
    setDialogMode("edit");
  };

  const openView = (item: Tag) => {
    setViewing(item);
    setDialogMode("view");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditing(null);
    setViewing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    const payload: Partial<Tag> = {
      name: form.name.trim(),
      // Empty string → backend auto-generates from name. Otherwise the admin's
      // override is passed through.
      slug: form.slug.trim() || undefined,
      active: form.active,
    };
    if (dialogMode === "edit" && editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    closeDialog();
  };

  const toggleActive = async (item: Tag, next: boolean) => {
    setTogglingId(item.id);
    try {
      await updateMutation.mutateAsync({ id: item.id, active: next });
    } finally {
      setTogglingId(null);
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;
  const slugPreview = form.slug.trim() || slugify(form.name);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "__serial",
      label: "#",
      render: (_v, _r, i) => (
        <span className="font-medium text-[var(--text-secondary)]">{i + 1}</span>
      ),
    },
    { key: "name", label: "Name", sortable: true },
    {
      key: "slug",
      label: "Slug",
      render: (val) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {(val as string) || "--"}
        </span>
      ),
    },
    {
      key: "active",
      label: "Active",
      render: (val, row) => {
        const item = row as unknown as Tag;
        return (
          <Switch
            checked={!!val}
            onChange={(next) => toggleActive(item, next)}
            loading={togglingId === item.id}
            label={`Toggle ${item.name}`}
          />
        );
      },
    },
    {
      key: "createdAt",
      label: "Created",
      render: (val) =>
        val ? new Date(val as string).toLocaleDateString() : "--",
    },
    {
      key: "id",
      label: "Actions",
      render: (_v, row) => {
        const item = row as unknown as Tag;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openView(item)}
              aria-label="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(item)}
              aria-label="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(item.id)}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
            </Button>
          </div>
        );
      },
    },
  ];

  const showForm = dialogMode === "create" || dialogMode === "edit";

  return (
    <div>
      <PageHeader
        title="Tags"
        description="Used for product categorisation and storefront filtering. Slugs are auto-generated and unique."
      >
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Tag
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          onSearch={setSearch}
          placeholder="Search name or slug..."
          className="w-full sm:max-w-sm"
        />
        <span className="text-xs text-[var(--text-muted)]">
          {rows.length} tag{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {error ? (
        <ErrorState message={(error as Error).message} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
          <Table
            columns={columns}
            data={rows as unknown as Record<string, unknown>[]}
            loading={isLoading}
            emptyMessage={
              search ? "No tags match your search" : "No tags yet."
            }
          />
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={closeDialog}
        title={dialogMode === "edit" ? "Edit Tag" : "Add Tag"}
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. New Arrival"
          />

          <div>
            <Input
              label="Slug (optional override)"
              value={form.slug}
              onChange={(e) =>
                setForm({ ...form, slug: slugify(e.target.value) })
              }
              placeholder="Leave blank to auto-generate"
            />
            {form.name && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Will save as{" "}
                <span className="font-mono text-[var(--accent-primary)]">
                  {slugPreview || "tag"}
                </span>
                . Must be unique — the server appends -2, -3… on collision.
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm({ ...form, active: e.target.checked })
              }
              className="h-4 w-4 rounded border-[var(--border-primary)] accent-[var(--accent-primary)]"
            />
            Active
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !form.name.trim()}
              loading={submitting}
            >
              {dialogMode === "edit" ? "Save Changes" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={dialogMode === "view"}
        onClose={closeDialog}
        title="Tag Details"
      >
        {viewing && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-primary-light,rgba(99,102,241,0.15))] text-[var(--accent-primary)]">
                <TagIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {viewing.name}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant={viewing.active !== false ? "success" : "danger"}
                  >
                    {viewing.active !== false ? "Active" : "Inactive"}
                  </Badge>
                  {viewing.slug && (
                    <span className="rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 font-mono text-xs text-[var(--text-secondary)]">
                      {viewing.slug}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" onClick={closeDialog}>
                Close
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
        title="Delete Tag"
        message="Are you sure you want to delete this tag? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-12 text-center">
      <AlertCircle className="h-6 w-6 text-[var(--accent-danger)]" />
      <p className="text-sm font-medium text-[var(--text-primary)]">
        Failed to load tags
      </p>
      <p className="max-w-sm text-xs text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
