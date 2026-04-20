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
  useAdminHeaders,
  useAdminCreateHeader,
  useAdminUpdateHeader,
  useAdminDeleteHeader,
} from "@/services/admin/banners";
import type { HeaderItem } from "@/types/banner";
import { Plus, Edit, Eye, Trash2, AlertCircle, Info } from "lucide-react";

type DialogMode = "create" | "edit" | "view" | null;

type HeaderForm = { name: string; active: boolean };
const emptyForm: HeaderForm = { name: "", active: true };

export default function HeaderMenuPage() {
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editing, setEditing] = useState<HeaderItem | null>(null);
  const [viewing, setViewing] = useState<HeaderItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<HeaderForm>(emptyForm);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { data: headers, isLoading, error } = useAdminHeaders();
  const createMutation = useAdminCreateHeader();
  const updateMutation = useAdminUpdateHeader();
  const deleteMutation = useAdminDeleteHeader();

  const rows = useMemo(() => {
    const list = headers ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((h) => h.name.toLowerCase().includes(q));
  }, [headers, search]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setDialogMode("create");
  };

  const openEdit = (item: HeaderItem) => {
    setEditing(item);
    setForm({ name: item.name, active: item.active });
    setDialogMode("edit");
  };

  const openView = (item: HeaderItem) => {
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
    const payload: Partial<HeaderItem> = {
      name: form.name.trim(),
      active: form.active,
    };
    if (dialogMode === "edit" && editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    closeDialog();
  };

  const toggleActive = async (item: HeaderItem, next: boolean) => {
    setTogglingId(item.id);
    try {
      await updateMutation.mutateAsync({ id: item.id, active: next });
    } finally {
      setTogglingId(null);
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

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
      key: "active",
      label: "Active",
      render: (val, row) => {
        const item = row as unknown as HeaderItem;
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
        const item = row as unknown as HeaderItem;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openView(item)}
              aria-label="View menu item"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(item)}
              aria-label="Edit menu item"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(item.id)}
              aria-label="Delete menu item"
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
        title="Header Menu"
        description="Top navigation menu shown across Wizard Mall and QuickGo storefronts"
      >
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Menu Item
        </Button>
      </PageHeader>

      <div className="mb-3 flex items-start gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-muted)]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
        <span>
          Items display on the storefront in the order they were added.
          <strong className="mx-1 font-semibold text-[var(--text-primary)]">
            Enter the Mall
          </strong>
          is always pinned to the first position.
        </span>
      </div>

      <div className="mb-4">
        <SearchInput
          onSearch={setSearch}
          placeholder="Search menu items..."
          className="max-w-sm"
        />
      </div>

      {error ? (
        <ErrorState message={(error as Error).message} />
      ) : (
        <Table
          columns={columns}
          data={rows as unknown as Record<string, unknown>[]}
          loading={isLoading}
          emptyMessage={
            search
              ? "No menu items match your search"
              : "No menu items yet. Add the first one."
          }
        />
      )}

      <Modal
        isOpen={showForm}
        onClose={closeDialog}
        title={dialogMode === "edit" ? "Edit Menu Item" : "Add Menu Item"}
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. New Arrivals"
          />
          <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
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
        title="Menu Item"
      >
        {viewing && (
          <div className="space-y-3">
            <Field label="Name" value={viewing.name} />
            <Field
              label="Status"
              value={
                <Badge variant={viewing.active ? "success" : "danger"}>
                  {viewing.active ? "Active" : "Inactive"}
                </Badge>
              }
            />
            <Field
              label="Created"
              value={new Date(viewing.createdAt).toLocaleString()}
            />
            <Field
              label="Updated"
              value={new Date(viewing.updatedAt).toLocaleString()}
            />
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
        title="Delete Menu Item"
        message="Are you sure you want to delete this menu item? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-[var(--text-primary)]">
        {value || <span className="text-[var(--text-muted)]">--</span>}
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-12 text-center">
      <AlertCircle className="h-6 w-6 text-[var(--accent-danger)]" />
      <p className="text-sm font-medium text-[var(--text-primary)]">
        Failed to load menu items
      </p>
      <p className="max-w-sm text-xs text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
