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
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { SearchableMultiSelect } from "@/components/ui/SearchableMultiSelect";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import { PlatformSelector } from "@/components/admin/form/PlatformSelector";
import { ImageUpload } from "@/components/admin/form/ImageUpload";
import {
  useCategories,
  useSubcategories,
  useCreateSubcategory,
  useUpdateSubcategory,
  useDeleteSubcategory,
} from "@/services/categories";
import { useLocationStates } from "@/services/admin/location";
import { useUpload } from "@/services/admin/upload";
import { resolveAssetUrl } from "@/lib/assetUrl";
import type { Subcategory } from "@/types/category";
import { Plus, Trash2, Edit, Eye, AlertCircle } from "lucide-react";

type DialogMode = "create" | "edit" | "view" | null;

type SubcategoryForm = {
  name: string;
  categoryId: number | "";
  active: boolean;
  platform: string[];
  cityIds: number[];
};

const emptyForm: SubcategoryForm = {
  name: "",
  categoryId: "",
  active: true,
  platform: [],
  cityIds: [],
};

export default function SubcategoryPage() {
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [viewing, setViewing] = useState<Subcategory | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<SubcategoryForm>(emptyForm);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { data: subcategories, isLoading, error } = useSubcategories();
  const { data: categories } = useCategories();
  const { data: locations, isLoading: locationsLoading } = useLocationStates();
  const createMutation = useCreateSubcategory();
  const updateMutation = useUpdateSubcategory();
  const deleteMutation = useDeleteSubcategory();
  const uploadMutation = useUpload();

  const rows = useMemo(() => {
    const list = subcategories ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.category?.name ?? "").toLowerCase().includes(q),
    );
  }, [subcategories, search]);

  const categoryOptions = useMemo(
    () =>
      (categories ?? []).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [categories],
  );

  const cityOptions = useMemo(
    () =>
      (locations ?? [])
        .filter((l) => !!l.city)
        .map((l) => ({
          value: l.id,
          label: `${l.city}, ${l.name}`,
          hint: l.countryName ?? undefined,
        })),
    [locations],
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setPendingImageFile(null);
    setExistingImage(null);
    setClearImage(false);
  };

  const openCreate = () => {
    resetForm();
    setDialogMode("create");
  };

  const openEdit = (item: Subcategory) => {
    setEditing(item);
    setExistingImage(item.image ?? null);
    setPendingImageFile(null);
    setClearImage(false);
    setForm({
      name: item.name,
      categoryId: item.categoryId ?? "",
      active: item.active,
      platform: item.platform ?? [],
      cityIds: (item.states ?? []).map((s) => s.id),
    });
    setDialogMode("edit");
  };

  const openView = (item: Subcategory) => {
    setViewing(item);
    setDialogMode("view");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setViewing(null);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!form.categoryId) return;
    const basePayload: Partial<Subcategory> & { stateIds?: number[] } = {
      name: form.name.trim(),
      categoryId: Number(form.categoryId),
      active: form.active,
      platform: form.platform,
      stateIds: form.cityIds,
    };

    let entityId: number | null = editing?.id ?? null;
    if (dialogMode === "edit" && entityId) {
      await updateMutation.mutateAsync({
        id: entityId,
        ...basePayload,
        // Empty string wipes the image; undefined leaves it untouched.
        image: clearImage ? "" : undefined,
      });
    } else {
      const created = (await createMutation.mutateAsync(
        basePayload,
      )) as unknown as { data?: Subcategory } | Subcategory;
      entityId =
        (created as Subcategory)?.id ??
        (created as { data?: Subcategory })?.data?.id ??
        null;
    }

    if (entityId && pendingImageFile) {
      try {
        const uploaded = await uploadMutation.mutateAsync({
          file: pendingImageFile,
          folder: "subcategories",
        });
        await updateMutation.mutateAsync({
          id: entityId,
          image: uploaded.url,
        });
      } catch {
        // handled by upload hook
      }
    }

    closeDialog();
  };

  const toggleActive = async (item: Subcategory, next: boolean) => {
    setTogglingId(item.id);
    try {
      await updateMutation.mutateAsync({ id: item.id, active: next });
    } finally {
      setTogglingId(null);
    }
  };

  const submitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadMutation.isPending;

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "__serial",
      label: "#",
      render: (_v, _r, i) => (
        <span className="font-medium text-[var(--text-secondary)]">{i + 1}</span>
      ),
    },
    {
      key: "image",
      label: "Image",
      render: (val) => {
        const src = resolveAssetUrl(val as string | null);
        return src ? (
          <img src={src} alt="" className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">
            --
          </div>
        );
      },
    },
    { key: "name", label: "Name", sortable: true },
    {
      key: "category",
      label: "Parent",
      render: (val) => {
        const cat = val as { name?: string } | undefined;
        return cat?.name ?? "--";
      },
    },
    {
      key: "platform",
      label: "Platforms",
      render: (val) => {
        const list = (val as string[] | undefined) ?? [];
        if (list.length === 0)
          return <span className="text-[var(--text-muted)]">--</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {list.map((p) => (
              <Badge key={p} variant="info">
                {p}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "active",
      label: "Active",
      render: (val, row) => {
        const item = row as unknown as Subcategory;
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
        const item = row as unknown as Subcategory;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openView(item)}
              aria-label="View subcategory"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(item)}
              aria-label="Edit subcategory"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(item.id)}
              aria-label="Delete subcategory"
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
        title="Subcategories"
        description="Manage product subcategories"
      >
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Subcategory
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput
          onSearch={setSearch}
          placeholder="Search by name or parent..."
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
              ? "No subcategories match your search"
              : "No subcategories yet. Add the first one."
          }
        />
      )}

      <Modal
        isOpen={showForm}
        onClose={closeDialog}
        title={dialogMode === "edit" ? "Edit Subcategory" : "Add Subcategory"}
        size="lg"
      >
        <div className="space-y-4">
          <PlatformSelector
            value={form.platform}
            onChange={(next) => setForm({ ...form, platform: next })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <SearchableSelect
              label="Parent Category"
              placeholder="Select category"
              searchPlaceholder="Search categories..."
              options={categoryOptions}
              value={form.categoryId}
              onChange={(v) =>
                setForm({ ...form, categoryId: v === "" ? "" : (v as number) })
              }
              clearable
            />

            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Smartphones"
            />
          </div>

          <ImageUpload
            label="Image"
            hint="Uploaded after save"
            value={clearImage ? null : existingImage}
            onFileChange={(file) => {
              setPendingImageFile(file);
              if (file) setClearImage(false);
            }}
            onClearPersisted={() => {
              setExistingImage(null);
              setClearImage(true);
            }}
          />

          <SearchableMultiSelect
            label="Cities"
            placeholder="Select cities (optional)"
            searchPlaceholder="Search cities..."
            options={cityOptions}
            value={form.cityIds}
            onChange={(next) => setForm({ ...form, cityIds: next })}
            loading={locationsLoading}
            emptyMessage="No cities configured — add them in Locations"
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
              disabled={submitting || !form.name.trim() || !form.categoryId}
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
        title="Subcategory Details"
        size="lg"
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 sm:flex-row sm:items-center">
              {viewing.image ? (
                <img
                  src={resolveAssetUrl(viewing.image)}
                  alt={viewing.name}
                  className="h-24 w-24 shrink-0 self-center rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 self-center items-center justify-center rounded-xl bg-[var(--bg-tertiary)] text-xs text-[var(--text-muted)]">
                  No image
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1.5">
                <h3 className="truncate text-lg font-semibold text-[var(--text-primary)]">
                  {viewing.name}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={viewing.active ? "success" : "danger"}>
                    {viewing.active ? "Active" : "Inactive"}
                  </Badge>
                  {viewing.category?.name && (
                    <span className="rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                      Under {viewing.category.name}
                    </span>
                  )}
                  {(viewing.platform ?? []).map((p) => (
                    <Badge key={p} variant="info">
                      {p}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Created {new Date(viewing.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Cities ({(viewing.states ?? []).length})
                </span>
              </div>
              {(viewing.states ?? []).length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">
                  No cities linked.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(viewing.states ?? []).map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-1 text-xs text-[var(--text-primary)]"
                    >
                      {s.city ? `${s.city}, ${s.name}` : s.name}
                    </span>
                  ))}
                </div>
              )}
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
        title="Delete Subcategory"
        message="Are you sure you want to delete this subcategory? This action cannot be undone."
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
        Failed to load subcategories
      </p>
      <p className="max-w-sm text-xs text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
