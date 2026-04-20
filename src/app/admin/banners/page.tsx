"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { PlatformSelector } from "@/components/admin/form/PlatformSelector";
import { ImageUpload } from "@/components/admin/form/ImageUpload";
import {
  PositionList,
  type PositionRow,
} from "@/components/admin/form/PositionList";
import { PositionSummary } from "@/components/admin/banners/PositionSummary";
import { Switch } from "@/components/ui/Switch";
import {
  useAdminBanners,
  useAdminCreateBanner,
  useAdminUpdateBanner,
  useAdminDeleteBanner,
} from "@/services/admin/banners";
import {
  useCountries,
  useLocationStates,
} from "@/services/admin/location";
import { useUpload } from "@/services/admin/upload";
import { resolveAssetUrl } from "@/lib/assetUrl";
import type { Banner } from "@/types/banner";
import {
  Plus,
  Edit,
  Eye,
  Trash2,
  AlertCircle,
} from "lucide-react";

type DialogMode = "create" | "edit" | "view" | null;

type BannerForm = {
  text: string;
  link: string;
  platform: string[];
  active: boolean;
  countries: PositionRow<string>[]; // countryCode + position
  cities: PositionRow<number>[]; // locationStateId + position
};

const emptyForm: BannerForm = {
  text: "",
  link: "",
  platform: ["wizard"],
  active: true,
  countries: [],
  cities: [],
};

export default function BannersPage() {
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [viewing, setViewing] = useState<Banner | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  // Deferred image: hold File until after create/update succeeds.
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { data: banners, isLoading, error } = useAdminBanners();
  const { data: countries, isLoading: countriesLoading } = useCountries();
  const { data: locations, isLoading: locationsLoading } = useLocationStates();

  const createMutation = useAdminCreateBanner();
  const updateMutation = useAdminUpdateBanner();
  const deleteMutation = useAdminDeleteBanner();
  const uploadMutation = useUpload();

  const rows = useMemo(() => {
    const list = banners ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (b) =>
        (b.text ?? "").toLowerCase().includes(q) ||
        (b.link ?? "").toLowerCase().includes(q),
    );
  }, [banners, search]);

  const countryOptions = useMemo(
    () =>
      (countries ?? []).map((c) => ({
        value: c.iso2 || c.code || String(c.id),
        label: c.name,
      })),
    [countries],
  );

  // Cities come from the Location master — only rows that have a city. Label
  // is "City, State" so admins can tell apart same-named cities.
  const cityOptions = useMemo(
    () =>
      (locations ?? [])
        .filter((l) => !!l.city)
        .map((l) => ({
          value: l.id,
          label: `${l.city}, ${l.name}`,
        })),
    [locations],
  );

  // Build "positions taken by other banners" so the form can flag collisions.
  const existingCountryPositions = useMemo(() => {
    const rows: PositionRow<string>[] = [];
    for (const b of banners ?? []) {
      if (editing && b.id === editing.id) continue;
      for (const c of b.countries ?? []) {
        rows.push({ refValue: c.countryCode, position: c.position });
      }
    }
    return rows;
  }, [banners, editing]);

  const existingCityPositions = useMemo(() => {
    const rows: PositionRow<number>[] = [];
    for (const b of banners ?? []) {
      if (editing && b.id === editing.id) continue;
      for (const s of b.states ?? []) {
        rows.push({ refValue: s.stateId, position: s.position });
      }
    }
    return rows;
  }, [banners, editing]);

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

  const openEdit = (b: Banner) => {
    setEditing(b);
    setExistingImage(b.image ?? null);
    setPendingImageFile(null);
    setClearImage(false);
    setForm({
      text: b.text ?? "",
      link: b.link ?? "",
      platform: b.platform ?? [],
      active: b.active,
      countries: (b.countries ?? []).map((c) => ({
        refValue: c.countryCode,
        position: c.position,
      })),
      cities: (b.states ?? []).map((s) => ({
        refValue: s.stateId,
        position: s.position,
      })),
    });
    setDialogMode("edit");
  };

  const openView = (b: Banner) => {
    setViewing(b);
    setDialogMode("view");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setViewing(null);
    resetForm();
  };

  const buildPayload = () => ({
    text: form.text.trim() || undefined,
    link: form.link.trim() || undefined,
    platform: form.platform,
    active: form.active,
    countries: form.countries.map((r) => ({
      countryCode: r.refValue,
      position: r.position,
    })),
    states: form.cities.map((r) => ({
      stateId: r.refValue,
      position: r.position,
    })),
  });

  const handleSubmit = async () => {
    // Step 1: create or update the banner row.
    let entityId: number | null = editing?.id ?? null;
    if (dialogMode === "edit" && entityId) {
      await updateMutation.mutateAsync({
        id: entityId,
        ...buildPayload(),
        image: clearImage ? undefined : undefined,
      });
    } else {
      const created = await createMutation.mutateAsync(buildPayload());
      entityId = created?.id ?? null;
    }

    // Step 2: now that the banner exists, upload the image (if any) and patch.
    if (entityId && pendingImageFile) {
      try {
        const uploaded = await uploadMutation.mutateAsync({
          file: pendingImageFile,
          folder: "banners",
        });
        await updateMutation.mutateAsync({
          id: entityId,
          image: uploaded.url,
        });
      } catch {
        // upload hook already toasts.
      }
    } else if (entityId && clearImage) {
      await updateMutation.mutateAsync({ id: entityId, image: undefined });
    }

    closeDialog();
  };

  const toggleActive = async (item: Banner, next: boolean) => {
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
        <span className="font-medium text-[var(--text-secondary)]">
          {i + 1}
        </span>
      ),
    },
    {
      key: "image",
      label: "Image",
      render: (val) => {
        const src = resolveAssetUrl(val as string | null);
        return src ? (
          <img
            src={src}
            alt=""
            className="h-10 w-16 rounded-md object-cover"
          />
        ) : (
          <span className="text-[var(--text-muted)]">--</span>
        );
      },
    },
    {
      key: "text",
      label: "Text",
      render: (val) =>
        val ? (
          <span className="line-clamp-2 max-w-xs text-sm">{val as string}</span>
        ) : (
          <span className="text-[var(--text-muted)]">--</span>
        ),
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
      key: "countries",
      label: "Countries",
      render: (val) => {
        const list = (val as Banner["countries"]) ?? [];
        if (list.length === 0)
          return <span className="text-[var(--text-muted)]">--</span>;
        const shown = list.slice(0, 3);
        const extra = list.length - shown.length;
        return (
          <div className="flex flex-wrap gap-1">
            {shown.map((c) => (
              <span
                key={`${c.countryCode}-${c.position}`}
                className="inline-flex items-center rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 text-xs text-[var(--text-secondary)]"
              >
                <span className="font-medium text-[var(--text-primary)]">
                  {c.countryCode}
                </span>
                <span className="ml-1 text-[var(--accent-primary)]">
                  #{c.position}
                </span>
              </span>
            ))}
            {extra > 0 && (
              <span className="text-xs text-[var(--text-muted)]">+{extra}</span>
            )}
          </div>
        );
      },
    },
    {
      key: "states",
      label: "Cities",
      render: (val) => {
        const list = (val as Banner["states"]) ?? [];
        if (list.length === 0)
          return <span className="text-[var(--text-muted)]">--</span>;
        return (
          <span className="text-xs text-[var(--text-secondary)]">
            {list.length} tag{list.length === 1 ? "" : "s"}
          </span>
        );
      },
    },
    {
      key: "active",
      label: "Active",
      render: (val, row) => {
        const item = row as unknown as Banner;
        return (
          <Switch
            checked={!!val}
            onChange={(next) => toggleActive(item, next)}
            loading={togglingId === item.id}
            label="Toggle banner"
          />
        );
      },
    },
    {
      key: "id",
      label: "Actions",
      render: (_v, row) => {
        const b = row as unknown as Banner;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openView(b)}
              aria-label="View banner"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(b)}
              aria-label="Edit banner"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(b.id)}
              aria-label="Delete banner"
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
        title="Banners"
        description="Storefront banners with country and city targeting"
      >
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Banner
        </Button>
      </PageHeader>

      {/* Position map — shows which (country, position) / (city, position)
          pairs are taken across ALL active banners, with missing gaps. */}
      <PositionSummary
        banners={banners}
        locations={locations}
        className="mb-4"
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          onSearch={setSearch}
          placeholder="Search text or link..."
          className="w-full sm:max-w-sm"
        />
        <span className="text-xs text-[var(--text-muted)]">
          {rows.length} banner{rows.length === 1 ? "" : "s"}
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
              search ? "No banners match your search" : "No banners yet."
            }
          />
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={closeDialog}
        title={dialogMode === "edit" ? "Edit Banner" : "Add Banner"}
        size="xl"
      >
        <div className="space-y-5">
          {/* Section 1: Basics */}
          <section className="space-y-4">
            <PlatformSelector
              value={form.platform}
              onChange={(next) => setForm({ ...form, platform: next })}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Textarea
                label="Text"
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="Promo text shown on the banner..."
                rows={3}
              />
              <div className="space-y-4">
                <Input
                  label="Link (optional)"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://..."
                />
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
              </div>
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
          </section>

          <div className="border-t border-[var(--border-primary)]" />

          {/* Section 2: Targeting — position slots. Position auto-suggests the
              next free slot when the admin picks a country or city. */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Targeting & position
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Pick a country / city — the next free position is pre-filled.
                Duplicate or missing positions are flagged live.
              </p>
            </div>

            <PositionList
              label="Countries"
              refLabel="Country"
              options={countryOptions}
              value={form.countries}
              onChange={(next) => setForm({ ...form, countries: next })}
              existing={existingCountryPositions}
              loading={countriesLoading}
              emptyMessage="No countries configured"
            />

            <PositionList
              label="Cities"
              refLabel="City"
              options={cityOptions}
              value={form.cities}
              onChange={(next) => setForm({ ...form, cities: next })}
              existing={existingCityPositions}
              loading={locationsLoading}
              emptyMessage="Add cities in Locations first"
            />
          </section>

          <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-primary)] pt-4 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || form.platform.length === 0}
              loading={submitting}
            >
              {dialogMode === "edit" ? "Save Changes" : "Create Banner"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={dialogMode === "view"}
        onClose={closeDialog}
        title="Banner Details"
        size="lg"
      >
        {viewing && (
          <div className="space-y-3">
            {viewing.image && (
              <img
                src={resolveAssetUrl(viewing.image)}
                alt=""
                className="w-full rounded-lg object-cover"
              />
            )}
            <Field label="Text" value={viewing.text} />
            <Field label="Link" value={viewing.link} />
            <Field
              label="Platforms"
              value={(viewing.platform ?? []).join(", ")}
            />
            <Field
              label="Countries"
              value={(viewing.countries ?? [])
                .map((c) => `${c.countryCode}#${c.position}`)
                .join(", ")}
            />
            <Field
              label="Cities (Location ID)"
              value={(viewing.states ?? [])
                .map((s) => `${s.stateId}#${s.position}`)
                .join(", ")}
            />
            <Field
              label="Status"
              value={
                <Badge variant={viewing.active ? "success" : "danger"}>
                  {viewing.active ? "Active" : "Inactive"}
                </Badge>
              }
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
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This action cannot be undone."
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
        Failed to load banners
      </p>
      <p className="max-w-sm text-xs text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
