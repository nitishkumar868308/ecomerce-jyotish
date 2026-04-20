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
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import { PincodeManager } from "@/components/admin/warehouse/PincodeManager";
import {
  useWarehouseLocations,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
} from "@/services/admin/warehouse";
import { useLocationStates } from "@/services/admin/location";
import type { WarehouseLocation } from "@/types/warehouse";
import {
  Plus,
  Edit,
  Eye,
  Trash2,
  AlertCircle,
  Warehouse,
  Building2,
  GitBranch,
} from "lucide-react";

type DialogMode = "create" | "edit" | "view" | null;
type FulfillmentMode = "own" | "other";

type WarehouseForm = {
  name: string;
  code: string;
  address: string;
  /** Maintained as an array internally; serialised to comma-separated on save. */
  pincodes: string[];
  contact: string;
  cityRefId: number | "";
  // Denormalised city + state — captured when the admin picks from the
  // Location master so the backend can accept them without a second lookup.
  city: string;
  state: string;
  active: boolean;
  fulfillmentMode: FulfillmentMode;
  fulfillmentWarehouseId: number | "";
};

const emptyForm: WarehouseForm = {
  name: "",
  code: "",
  address: "",
  pincodes: [],
  contact: "",
  cityRefId: "",
  city: "",
  state: "",
  active: true,
  fulfillmentMode: "own",
  fulfillmentWarehouseId: "",
};

const parsePincodes = (raw: string | null | undefined): string[] => {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(/[^0-9]+/)
        .map((t) => t.trim())
        .filter((t) => /^\d{6}$/.test(t)),
    ),
  );
};

export default function WarehouseLocationPage() {
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editing, setEditing] = useState<WarehouseLocation | null>(null);
  const [viewing, setViewing] = useState<WarehouseLocation | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<WarehouseForm>(emptyForm);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { data: warehouses, isLoading, error } = useWarehouseLocations();
  const { data: locations, isLoading: locationsLoading } = useLocationStates();
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const deleteMutation = useDeleteWarehouse();

  const rows = useMemo(() => {
    const list = warehouses ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.city ?? "").toLowerCase().includes(q) ||
        w.state.toLowerCase().includes(q) ||
        w.pincode.toLowerCase().includes(q) ||
        w.code.toLowerCase().includes(q),
    );
  }, [warehouses, search]);

  // Only rows from the Location master that have a city populated (we need a
  // city string to denormalise on the warehouse).
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

  const fulfillmentModeOptions = useMemo(
    () => [
      { value: "own" as const, label: "Own", hint: "This warehouse fulfils its own orders" },
      { value: "other" as const, label: "Other", hint: "Orders are fulfilled by a different warehouse" },
    ],
    [],
  );

  const otherWarehouseOptions = useMemo(() => {
    const list = warehouses ?? [];
    const excludeId = editing?.id ?? null;
    return list
      .filter((w) => !w.deleted && w.id !== excludeId)
      .map((w) => ({
        value: w.id,
        label: `${w.name} (${w.code})`,
        hint: [w.city, w.state].filter(Boolean).join(", ") || undefined,
      }));
  }, [warehouses, editing]);

  // City must be unique across warehouses — fulfillment relationships may
  // share a destination, but the city picker itself enforces one warehouse
  // per city (excluding the row being edited).
  const duplicateCityWarehouse = useMemo(() => {
    if (!form.city) return null;
    const target = form.city.trim().toLowerCase();
    if (!target) return null;
    return (warehouses ?? []).find(
      (w) =>
        !w.deleted &&
        w.id !== (editing?.id ?? -1) &&
        (w.city ?? "").trim().toLowerCase() === target,
    );
  }, [warehouses, form.city, editing]);

  const usedCityKeys = useMemo(() => {
    const keys = new Set<string>();
    const excludeId = editing?.id ?? -1;
    for (const w of warehouses ?? []) {
      if (w.deleted || w.id === excludeId) continue;
      if (!w.city) continue;
      keys.add(w.city.trim().toLowerCase());
    }
    return keys;
  }, [warehouses, editing]);

  // Annotate taken cities in the picker so the admin sees conflicts before
  // selecting. Actual enforcement happens via the `duplicateCityWarehouse`
  // check (inline error + submit disable).
  const cityOptionsWithLock = useMemo(
    () =>
      cityOptions.map((opt) => {
        const cityName = opt.label.split(",")[0]?.trim().toLowerCase() ?? "";
        const taken = usedCityKeys.has(cityName);
        return taken
          ? { ...opt, hint: "Already assigned to a warehouse" }
          : opt;
      }),
    [cityOptions, usedCityKeys],
  );

  const warehouseById = useMemo(() => {
    const map = new Map<number, WarehouseLocation>();
    for (const w of warehouses ?? []) map.set(w.id, w);
    return map;
  }, [warehouses]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogMode("create");
  };

  const openEdit = (w: WarehouseLocation) => {
    setEditing(w);
    setForm({
      name: w.name,
      code: w.code,
      address: w.address,
      pincodes: parsePincodes(w.pincode),
      contact: w.contact ?? "",
      cityRefId: w.cityRefId ?? "",
      city: w.city ?? "",
      state: w.state,
      active: w.active,
      fulfillmentMode: w.fulfillmentWarehouseId ? "other" : "own",
      fulfillmentWarehouseId: w.fulfillmentWarehouseId ?? "",
    });
    setDialogMode("edit");
  };

  const openView = (w: WarehouseLocation) => {
    setViewing(w);
    setDialogMode("view");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditing(null);
    setViewing(null);
    resetForm();
  };

  const pickCity = (locationId: number | "") => {
    if (locationId === "") {
      setForm((f) => ({ ...f, cityRefId: "", city: "", state: "" }));
      return;
    }
    const loc = (locations ?? []).find((l) => l.id === locationId);
    if (!loc) return;
    setForm((f) => ({
      ...f,
      cityRefId: loc.id,
      city: loc.city ?? "",
      state: loc.name, // State master's `name` column holds the state's display name.
    }));
  };

  const handleSubmit = async () => {
    const payload: Partial<WarehouseLocation> = {
      name: form.name.trim(),
      code: form.code.trim(),
      address: form.address.trim(),
      pincode: form.pincodes.join(","),
      contact: form.contact.trim() || undefined,
      cityRefId:
        typeof form.cityRefId === "number" ? form.cityRefId : undefined,
      city: form.city || undefined,
      state: form.state,
      active: form.active,
      fulfillmentWarehouseId:
        form.fulfillmentMode === "other" &&
        typeof form.fulfillmentWarehouseId === "number"
          ? form.fulfillmentWarehouseId
          : null,
    };
    if (dialogMode === "edit" && editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    closeDialog();
  };

  const toggleActive = async (item: WarehouseLocation, next: boolean) => {
    setTogglingId(item.id);
    try {
      await updateMutation.mutateAsync({ id: item.id, active: next });
    } finally {
      setTogglingId(null);
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;
  const canSubmit =
    !!form.name.trim() &&
    !!form.code.trim() &&
    !!form.address.trim() &&
    form.pincodes.length > 0 &&
    !!form.state &&
    !duplicateCityWarehouse &&
    (form.fulfillmentMode === "own" ||
      typeof form.fulfillmentWarehouseId === "number");

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
    { key: "name", label: "Name", sortable: true },
    { key: "code", label: "Code" },
    {
      key: "city",
      label: "City",
      render: (val) =>
        val ? (
          (val as string)
        ) : (
          <span className="text-[var(--text-muted)]">--</span>
        ),
    },
    { key: "state", label: "State", sortable: true },
    {
      key: "pincode",
      label: "Pincodes",
      render: (val) => {
        const list = parsePincodes(val as string);
        if (list.length === 0) {
          return <span className="text-[var(--text-muted)]">--</span>;
        }
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-[var(--text-secondary)]">
              {list[0]}
            </span>
            {list.length > 1 && (
              <span className="rounded-md bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
                +{(list.length - 1).toLocaleString()}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "fulfillmentWarehouseId",
      label: "Fulfilment",
      render: (val) => {
        const id = typeof val === "number" ? val : null;
        if (!id) {
          return (
            <Badge variant="success">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Own
              </span>
            </Badge>
          );
        }
        const target = warehouseById.get(id);
        return (
          <div className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
            <span className="text-xs text-[var(--text-secondary)]">
              {target ? target.code : `#${id}`}
            </span>
          </div>
        );
      },
    },
    {
      key: "active",
      label: "Active",
      render: (val, row) => {
        const item = row as unknown as WarehouseLocation;
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
        const item = row as unknown as WarehouseLocation;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openView(item)}
              aria-label="View warehouse"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(item)}
              aria-label="Edit warehouse"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(item.id)}
              aria-label="Delete warehouse"
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
        title="Warehouses"
        description="Fulfillment locations — used for storefront city + pincode selection"
      >
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Warehouse
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput
          onSearch={setSearch}
          placeholder="Search by name, code, city, state or pincode..."
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
              ? "No warehouses match your search"
              : "No warehouses yet. Add the first one."
          }
        />
      )}

      <Modal
        isOpen={showForm}
        onClose={closeDialog}
        title={dialogMode === "edit" ? "Edit Warehouse" : "Add Warehouse"}
        size="xl"
      >
        <div className="space-y-6">
          {/* Section: Identity */}
          <FormSection
            title="Identity"
            description="How this warehouse shows up across the admin."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Mumbai Central"
              />
              <Input
                label="Code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. WH-MUM-01"
              />
            </div>
          </FormSection>

          {/* Section: Location */}
          <FormSection
            title="Location"
            description="Pick a city from your Locations master — state auto-fills."
          >
            <SearchableSelect
              label="City (from Locations master)"
              placeholder={
                locationsLoading ? "Loading cities..." : "Select city"
              }
              searchPlaceholder="Search cities..."
              options={cityOptionsWithLock}
              value={form.cityRefId}
              onChange={(v) => pickCity(v === "" ? "" : (v as number))}
              loading={locationsLoading}
              emptyMessage="No cities configured — add them in Locations"
              clearable
            />

            {duplicateCityWarehouse ? (
              <div className="flex items-start gap-2 rounded-lg border border-[var(--accent-danger)]/40 bg-red-50 px-3 py-2 text-xs text-[var(--accent-danger)] dark:bg-red-950/20">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  <strong>{duplicateCityWarehouse.name}</strong> (
                  {duplicateCityWarehouse.code}) already covers{" "}
                  <strong>{duplicateCityWarehouse.city}</strong>. Only one
                  warehouse per city is allowed — pick a different city or edit
                  the existing warehouse.
                </span>
              </div>
            ) : (
              form.city && (
                <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-muted)]">
                  Selected:{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {form.city}, {form.state}
                  </span>
                </div>
              )
            )}

            <Textarea
              label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Street address..."
              rows={2}
            />
          </FormSection>

          {/* Section: Pincodes */}
          <FormSection
            title="Service Pincodes"
            description="All pincodes this warehouse services. Paste from Excel / CSV or upload a file — duplicates and invalid entries are skipped automatically."
          >
            <PincodeManager
              value={form.pincodes}
              onChange={(next) => setForm((f) => ({ ...f, pincodes: next }))}
            />
          </FormSection>

          {/* Section: Fulfillment */}
          <FormSection
            title="Fulfillment Center"
            description="Does this warehouse fulfil its own orders, or does another warehouse ship on its behalf?"
          >
            <SearchableSelect
              label="Fulfilled by"
              placeholder="Select fulfilment mode"
              options={fulfillmentModeOptions}
              value={form.fulfillmentMode}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  fulfillmentMode: (v as FulfillmentMode) || "own",
                  fulfillmentWarehouseId:
                    v === "own" ? "" : f.fulfillmentWarehouseId,
                }))
              }
            />

            {form.fulfillmentMode === "other" && (
              <SearchableSelect
                label="Fulfilment warehouse"
                placeholder={
                  otherWarehouseOptions.length === 0
                    ? "No other warehouses available"
                    : "Search by name or code..."
                }
                searchPlaceholder="Search warehouses..."
                options={otherWarehouseOptions}
                value={form.fulfillmentWarehouseId}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    fulfillmentWarehouseId:
                      v === "" ? "" : (v as number),
                  }))
                }
                emptyMessage="No matching warehouses"
                clearable
              />
            )}
          </FormSection>

          {/* Section: Contact & Status */}
          <FormSection
            title="Contact & Status"
            description="Optional contact info. Inactive warehouses are hidden from the storefront."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Contact (optional)"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="Phone / email"
              />
              <div className="flex items-end">
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
          </FormSection>

          <div className="flex justify-end gap-2 border-t border-[var(--border-primary)] pt-4">
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
        title="Warehouse Details"
        size="lg"
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-primary-light,rgba(99,102,241,0.15))] text-[var(--accent-primary)]">
                <Warehouse className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="truncate text-lg font-semibold text-[var(--text-primary)]">
                  {viewing.name}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={viewing.active ? "success" : "danger"}>
                    {viewing.active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                    Code {viewing.code}
                  </span>
                  <span className="rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                    {parsePincodes(viewing.pincode).length.toLocaleString()} pincodes
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="City" value={viewing.city || "--"} />
              <Field label="State" value={viewing.state} />
              <Field label="Contact" value={viewing.contact || "--"} />
              <Field
                label="Fulfilment"
                value={
                  viewing.fulfillmentWarehouseId
                    ? (() => {
                        const target = warehouseById.get(
                          viewing.fulfillmentWarehouseId,
                        );
                        return target
                          ? `${target.name} (${target.code})`
                          : `#${viewing.fulfillmentWarehouseId}`;
                      })()
                    : "Own"
                }
              />
              <Field
                label="Created"
                value={
                  viewing.createdAt
                    ? new Date(viewing.createdAt).toLocaleString()
                    : "--"
                }
              />
            </div>

            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Address
              </p>
              <p className="text-sm text-[var(--text-primary)]">
                {viewing.address}
              </p>
            </div>

            <ViewPincodes raw={viewing.pincode} />

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
        title="Delete Warehouse"
        message="Are you sure you want to delete this warehouse? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
      <header>
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </h4>
        {description && (
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {description}
          </p>
        )}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ViewPincodes({ raw }: { raw: string | null | undefined }) {
  const [query, setQuery] = useState("");
  const list = useMemo(() => parsePincodes(raw), [raw]);
  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return list;
    return list.filter((p) => p.includes(q));
  }, [list, query]);

  if (list.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Pincodes ({list.length.toLocaleString()})
        </p>
        {list.length > 8 && (
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-32 rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-1 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
        )}
      </div>
      <div className="max-h-40 overflow-y-auto">
        <div className="flex flex-wrap gap-1">
          {filtered.map((pin) => (
            <span
              key={pin}
              className="rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-primary)]"
            >
              {pin}
            </span>
          ))}
        </div>
      </div>
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
      <p className="mt-0.5 text-sm text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-12 text-center">
      <AlertCircle className="h-6 w-6 text-[var(--accent-danger)]" />
      <p className="text-sm font-medium text-[var(--text-primary)]">
        Failed to load warehouses
      </p>
      <p className="max-w-sm text-xs text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
