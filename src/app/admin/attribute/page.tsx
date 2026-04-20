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
  useAttributes,
  useCreateAttribute,
  useUpdateAttribute,
  useDeleteAttribute,
  type Attribute,
} from "@/services/admin/attributes";
import { Plus, Edit, Eye, Trash2, AlertCircle, Tags } from "lucide-react";

type DialogMode = "create" | "edit" | "view" | null;

type AttributeForm = {
  name: string;
  valuesRaw: string;
  active: boolean;
};

const emptyForm: AttributeForm = { name: "", valuesRaw: "", active: true };

/** Split "Red, Green , Blue" into ["Red", "Green", "Blue"] — trim + dedupe. */
function parseValues(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[,\n]/)
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  );
}

export default function AttributePage() {
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editing, setEditing] = useState<Attribute | null>(null);
  const [viewing, setViewing] = useState<Attribute | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<AttributeForm>(emptyForm);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { data, isLoading, error } = useAttributes();
  const createMutation = useCreateAttribute();
  const updateMutation = useUpdateAttribute();
  const deleteMutation = useDeleteAttribute();

  const rows = useMemo(() => {
    const list = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.values.some((v) => v.toLowerCase().includes(q)),
    );
  }, [data, search]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setDialogMode("create");
  };
  const openEdit = (item: Attribute) => {
    setEditing(item);
    setForm({
      name: item.name,
      valuesRaw: item.values.join(", "),
      active: item.active,
    });
    setDialogMode("edit");
  };
  const openView = (item: Attribute) => {
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
    const values = parseValues(form.valuesRaw);
    const payload = {
      name: form.name.trim(),
      values,
      active: form.active,
    };
    if (dialogMode === "edit" && editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    closeDialog();
  };

  const toggleActive = async (item: Attribute, next: boolean) => {
    setTogglingId(item.id);
    try {
      await updateMutation.mutateAsync({ id: item.id, active: next });
    } finally {
      setTogglingId(null);
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;
  const parsed = parseValues(form.valuesRaw);
  const canSubmit = form.name.trim() && parsed.length > 0;

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
      key: "values",
      label: "Values",
      render: (val) => {
        const arr = (val as string[] | undefined) ?? [];
        if (arr.length === 0)
          return <span className="text-[var(--text-muted)]">--</span>;
        const shown = arr.slice(0, 6);
        return (
          <div className="flex flex-wrap gap-1">
            {shown.map((v) => (
              <span
                key={v}
                className="inline-flex items-center rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 text-xs text-[var(--text-secondary)]"
              >
                {v}
              </span>
            ))}
            {arr.length > shown.length && (
              <span className="text-xs text-[var(--text-muted)]">
                +{arr.length - shown.length}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "active",
      label: "Active",
      render: (val, row) => {
        const item = row as unknown as Attribute;
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
      key: "id",
      label: "Actions",
      render: (_v, row) => {
        const item = row as unknown as Attribute;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openView(item)}
              aria-label="View attribute"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(item)}
              aria-label="Edit attribute"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(item.id)}
              aria-label="Delete attribute"
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
        title="Attributes"
        description="Global product attributes — Color, Size, Material, etc. Used by variations."
      >
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Attribute
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          onSearch={setSearch}
          placeholder="Search attribute or value..."
          className="w-full sm:max-w-sm"
        />
        <span className="text-xs text-[var(--text-muted)]">
          {rows.length} attribute{rows.length === 1 ? "" : "s"}
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
              search
                ? "No attributes match your search"
                : "No attributes yet. Add the first one."
            }
          />
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={closeDialog}
        title={dialogMode === "edit" ? "Edit Attribute" : "Add Attribute"}
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Color"
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
              Values{" "}
              <span className="text-xs font-normal text-[var(--text-muted)]">
                (comma or newline separated)
              </span>
            </label>
            <textarea
              value={form.valuesRaw}
              onChange={(e) =>
                setForm({ ...form, valuesRaw: e.target.value })
              }
              rows={3}
              placeholder="e.g. Red, Blue, Green"
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            />
            {parsed.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {parsed.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center rounded-md bg-[var(--accent-primary-light,rgba(99,102,241,0.1))] px-1.5 py-0.5 text-xs font-medium text-[var(--accent-primary)]"
                  >
                    {v}
                  </span>
                ))}
              </div>
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
              disabled={submitting || !canSubmit}
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
        title="Attribute Details"
      >
        {viewing && (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-primary-light,rgba(99,102,241,0.15))] text-[var(--accent-primary)]">
                <Tags className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {viewing.name}
                </h3>
                <div className="flex items-center gap-1.5">
                  <Badge variant={viewing.active ? "success" : "danger"}>
                    {viewing.active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-[var(--text-muted)]">
                    {viewing.values.length} values
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Values
              </p>
              <div className="flex flex-wrap gap-1.5">
                {viewing.values.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-1 text-xs text-[var(--text-primary)]"
                  >
                    {v}
                  </span>
                ))}
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
        title="Delete Attribute"
        message="Are you sure you want to delete this attribute? This action cannot be undone."
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
        Failed to load attributes
      </p>
      <p className="max-w-sm text-xs text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
